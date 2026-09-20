import { Platform } from 'react-native'

import { Sha256 } from '@aws-crypto/sha256-js'
import { HttpRequest } from '@smithy/protocol-http'
import { SignatureV4 } from '@smithy/signature-v4'
import * as Application from 'expo-application'
import * as SecureStore from 'expo-secure-store'
import mqtt, { type MqttClient } from 'mqtt'

import { areasQueryFn } from '@/queries/areas'
import { getAwsIoTSession } from '@/services/awsIoT'
import { normalizeMqttPayload } from '@/utils/mqttPayload'

export let mqttClient: MqttClient | null = null
export let subscribedTopics: string[] = []
let activeRun: Promise<void> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectQueued = false
let connectionGeneration = 0
let teardownPromise: Promise<void> | null = null

type MqttMessageHandler = (topic: string, message: string) => void
let messageHandler: MqttMessageHandler | null = null
type MqttConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
let connectionStateHandler: ((status: MqttConnectionState) => void) | null =
	null

/** Register the callback invoked for every incoming MQTT message. */
export function setMqttMessageHandler(handler: MqttMessageHandler) {
	messageHandler = handler
}

export function setMqttConnectionStateHandler(
	handler: ((status: MqttConnectionState) => void) | null,
) {
	connectionStateHandler = handler
}

export async function getUniqueDeviceId(): Promise<string> {
	try {
		if (Platform.OS === 'android') {
			const androidId = Application.getAndroidId()
			if (androidId) return `hl-android-${androidId}`
		}
		if (Platform.OS === 'ios') {
			const idfv = await Application.getIosIdForVendorAsync()
			if (idfv) return `hl-ios-${idfv}`
		}

		let fallbackId = await SecureStore.getItemAsync('fallback_device_id')
		if (!fallbackId) {
			fallbackId =
				typeof crypto !== 'undefined' && crypto.randomUUID
					? `hl-fallback-${crypto.randomUUID()}`
					: `hl-fallback-${Math.random().toString(36).slice(2, 15)}-${Date.now()}`
			await SecureStore.setItemAsync('fallback_device_id', fallbackId)
		}
		return fallbackId
	} catch (error) {
		console.error('Failed to get device ID', error)
		return `generic-client-${Math.floor(Math.random() * 10000)}`
	}
}

const getRequiredEnv = (name: string, value: string | undefined) => {
	if (!value) throw new Error(`${name} is not configured`)
	return value.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const getIoTEndpoint = () =>
	getRequiredEnv(
		'EXPO_PUBLIC_AWS_IOT_ENDPOINT',
		process.env.EXPO_PUBLIC_AWS_IOT_ENDPOINT,
	)

const getAwsRegion = () =>
	getRequiredEnv('EXPO_PUBLIC_AWS_REGION', process.env.EXPO_PUBLIC_AWS_REGION)

async function createSignedMqttUrl(
	endpoint: string,
	region: string,
	credentials: Awaited<ReturnType<typeof getAwsIoTSession>>['credentials'],
): Promise<string> {
	// AWS IoT's WebSocket endpoint is special: with temporary credentials the
	// session token must be appended to the URL *after* signing, not folded into
	// the canonical request. Generic SigV4 signers (smithy included) include it in
	// the canonical query, and the Device Gateway then rejects the upgrade with
	// HTTP 403. Sign without the token, then append it encoded.
	const { sessionToken, ...signingCredentials } = credentials

	const signer = new SignatureV4({
		credentials: signingCredentials,
		region,
		service: 'iotdevicegateway',
		sha256: Sha256,
	})
	const request = new HttpRequest({
		protocol: 'https:',
		hostname: endpoint,
		method: 'GET',
		path: '/mqtt',
		headers: { host: endpoint },
	})
	const signedRequest = await signer.presign(request, { expiresIn: 900 })
	const query = new URLSearchParams(
		signedRequest.query as Record<string, string>,
	).toString()
	const tokenQuery = sessionToken
		? `&X-Amz-Security-Token=${encodeURIComponent(sessionToken)}`
		: ''
	return `wss://${endpoint}/mqtt?${query}${tokenQuery}`
}

async function getLiveTopics(): Promise<string[]> {
	const areas = await areasQueryFn()
	return areas
		.filter((area) => area.key)
		.flatMap((area) => [
			`hydro/${area.key}/status`,
			`hydro/${area.key}/logs`,
			`hydro/${area.key}/announce`,
		])
}

function scheduleReconnect(generation: number) {
	if (reconnectTimer || generation !== connectionGeneration) return
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null
		if (generation !== connectionGeneration) return
		void initMqtt()
	}, 2000)
}

/**
 * Tear down the MQTT client. Must be called when the provider unmounts: without
 * it, a remount (Fast Refresh, StrictMode, provider re-mount) leaves the old
 * socket open and opens a second one with the same client id. AWS IoT permits a
 * single connection per client id, so each new socket kicks the previous one and
 * the app flaps between "Subscribed" and "connection closed" forever.
 */
export function endMqtt(): Promise<void> {
	// Invalidate in-flight handlers and any scheduled reconnect.
	connectionGeneration++
	reconnectQueued = false
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
		reconnectTimer = null
	}

	const client = mqttClient
	mqttClient = null
	subscribedTopics = []

	teardownPromise = (async () => {
		if (client) {
			try {
				await client.endAsync(true)
			} catch (error) {
				console.warn('Error ending AWS IoT client:', error)
			}
		}
		teardownPromise = null
	})()

	return teardownPromise
}

export const initMqtt = async (): Promise<void> => {
	if (activeRun) {
		reconnectQueued = true
		return activeRun.then(() => {
			if (reconnectQueued) return initMqtt()
		})
	}

	reconnectQueued = false
	const generation = ++connectionGeneration
	activeRun = (async () => {
		try {
			if (reconnectTimer) {
				clearTimeout(reconnectTimer)
				reconnectTimer = null
			}
			// Wait for an in-flight teardown (from a provider unmount/remount) so the
			// previous socket is closed before we open a new one with the same id.
			if (teardownPromise) {
				await teardownPromise
			}
			if (mqttClient) {
				const staleClient = mqttClient
				mqttClient = null
				try {
					await staleClient.endAsync(true)
				} catch (error) {
					console.warn('Error closing existing AWS IoT client:', error)
				}
			}

			const endpoint = getIoTEndpoint()
			const region = getAwsRegion()
			const [{ identityId, credentials }, deviceSuffix, topicsToSubscribe] =
				await Promise.all([
					getAwsIoTSession(),
					getUniqueDeviceId(),
					getLiveTopics(),
				])
			// A per-connection nonce keeps the client id unique across reconnects and
			// remounts. AWS IoT allows only one connection per client id and silently
			// drops a duplicate, which shows up as "connack timeout". The IoT policy
			// allows any suffix after the identity id (`client/<identityId>:*`).
			const clientId = `${identityId}:${deviceSuffix}:${Date.now().toString(36)}`
			const signedUrl = await createSignedMqttUrl(endpoint, region, credentials)
			subscribedTopics = topicsToSubscribe

			console.log(
				`Connecting to AWS IoT with client ID ${clientId}; subscribing to ${topicsToSubscribe.join(', ')}`,
			)
			console.log(`[AWS IoT] endpoint=${endpoint} region=${region}`)

			// Create the client synchronously and attach listeners *before* the
			// handshake finishes. mqtt.connectAsync() only attaches its internal
			// listeners after CONNACK, so an early socket error or close is missed
			// and the promise can hang forever with no log.
			const client = mqtt.connect(signedUrl, {
				clientId,
				clean: true,
				connectTimeout: 10000,
				reconnectPeriod: 0,
				createWebsocket: (_url: string, protocols: string[]) => {
					const ws = new WebSocket(signedUrl, protocols)
					ws.addEventListener('close', (event) => {
						console.warn(
							`[AWS IoT] websocket closed code=${event.code} reason="${event.reason}"`,
						)
					})
					ws.addEventListener('error', () => {
						console.warn(
							'[AWS IoT] websocket error (handshake rejected or transport failure)',
						)
					})
					return ws
				},
			})
			mqttClient = client

			client.on('message', (topic: string, payload: Uint8Array | string) => {
				const rawMessage = normalizeMqttPayload(payload)
				messageHandler?.(topic, rawMessage)
			})
			client.on('error', (error) => {
				connectionStateHandler?.('ERROR')
				console.error('[AWS IoT] client error:', error)
			})
			client.on('close', () => {
				if (mqttClient !== client || generation !== connectionGeneration) return
				mqttClient = null
				connectionStateHandler?.('DISCONNECTED')
				console.warn('[AWS IoT] connection closed; scheduling reconnect')
				scheduleReconnect(generation)
			})

			await new Promise<void>((resolve, reject) => {
				const timer = setTimeout(() => {
					void client.endAsync(true)
					reject(
						new Error(
							'AWS IoT connection timed out after 10s ' +
								'(no CONNACK; usually a denied CONNECT or a bad presigned URL)',
						),
					)
				}, 10000)
				client.once('connect', () => {
					clearTimeout(timer)
					resolve()
				})
				client.once('error', (error) => {
					clearTimeout(timer)
					reject(error)
				})
				client.once('close', () => {
					clearTimeout(timer)
					reject(
						new Error(
							'AWS IoT socket closed before CONNACK ' +
								'(denied CONNECT, bad signature, or unreachable endpoint)',
						),
					)
				})
			})

			connectionStateHandler?.('CONNECTED')

			// Subscribe one topic at a time. AWS IoT closes the connection when a
			// SUBSCRIBE is not authorized, and the close tells us nothing about
			// which topic was denied; per-topic logging names the culprit.
			for (const topic of topicsToSubscribe) {
				try {
					const grants = await client.subscribeAsync(topic, { qos: 1 })
					console.log(
						`Subscribed to ${topic} (granted: ${JSON.stringify(grants)})`,
					)
				} catch (error) {
					console.warn(`[AWS IoT] subscribe failed for ${topic}:`, error)
				}
			}
		} catch (error) {
			console.error('[AWS IoT] failed to initialize read channel:', error)
			mqttClient = null
			scheduleReconnect(generation)
		} finally {
			activeRun = null
		}
	})()

	return activeRun
}
