import { Platform } from 'react-native'

import * as Application from 'expo-application'
import * as SecureStore from 'expo-secure-store'
import mqtt from 'mqtt'

import { getMqttCredentials } from '@/queries/auth'
import { decodeJwt } from '@/utils/decodeJwt'
import { normalizeMqttPayload } from '@/utils/mqttPayload'

export let mqttClient: any = null
export let publishableTopics: string[] = []
let activeRun: Promise<void> | null = null
let rerunQueued = false

type MqttMessageHandler = (topic: string, message: string) => void
let messageHandler: MqttMessageHandler | null = null

/** Register the callback invoked for every incoming MQTT message. */
export function setMqttMessageHandler(handler: MqttMessageHandler) {
	messageHandler = handler
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
			if (typeof crypto !== 'undefined' && crypto.randomUUID) {
				fallbackId = `hl-fallback-${crypto.randomUUID()}`
			} else {
				fallbackId = `hl-fallback-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`
			}
			await SecureStore.setItemAsync('fallback_device_id', fallbackId)
		}

		return fallbackId
	} catch (error) {
		console.error('Failed to get device ID', error)
		return 'generic-client-' + Math.floor(Math.random() * 10000)
	}
}

export const initMqtt = async (): Promise<void> => {
	if (activeRun) {
		// Don't drop this call — it may carry newer credentials (e.g. after
		// linking a new area). Queue exactly one follow-up run once the
		// current attempt finishes, and let this caller await that result.
		console.log('MQTT init already in progress, queuing a follow-up run...')
		rerunQueued = true
		return activeRun.then(() => {
			if (rerunQueued) return initMqtt()
		})
	}

	rerunQueued = false
	activeRun = (async () => {
		try {
			if (mqttClient) {
				console.log(
					'Existing MQTT client detected. Tearing down before re-initialization...',
				)
				const staleClient = mqttClient
				mqttClient = null
				try {
					await staleClient.endAsync(true)
				} catch (e) {
					console.warn('Error closing existing client:', e)
				}
			}

			const brokerUrlStr = process.env.EXPO_PUBLIC_MQTT_BROKER_URL
			if (!brokerUrlStr) {
				throw new Error(
					'MQTT broker URL is not defined in the environment variables.',
				)
			}

			const clientId = await getUniqueDeviceId()
			const mqttCredentials = await getMqttCredentials()

			if (
				!mqttCredentials ||
				!mqttCredentials.mqttToken ||
				mqttCredentials.userId === undefined
			) {
				throw new Error('MQTT token or user ID is missing in the credentials.')
			}

			const { mqttToken, userId } = mqttCredentials
			const claims = decodeJwt(mqttToken)
			const topicsToSubscribe: string[] = claims?.subs || []
			publishableTopics = claims?.publ || []

			console.log(
				`Initializing MQTT with client ID: ${clientId}, user ID: ${userId}`,
			)
			mqttClient = await mqtt.connectAsync(brokerUrlStr, {
				clientId,
				username: String(userId),
				password: mqttToken,
				clean: true,
				connectTimeout: 10000,
				reconnectPeriod: 2000,
			})

			// Attach the message listener BEFORE subscribing. Retained messages
			// (e.g. OTA announcements) are delivered the instant the subscription
			// completes; attaching on('message') after subscribeAsync would miss
			// them forever. The handler is set by the app via setMqttMessageHandler.
			mqttClient.on('message', (topic: string, payload: any) => {
				// Normalize the payload: some brokers/servers publish with a
				// UTF-8 BOM, null bytes, or CRLF framing which would otherwise
				// make JSON.parse() fail on valid JSON. normalizeMqttPayload
				// strips any junk surrounding the JSON so every consumer
				// (area store, OTA notifications) gets clean text.
				const rawMessage = normalizeMqttPayload(payload)

				if (messageHandler) {
					messageHandler(topic, rawMessage)
				}
			})

			if (topicsToSubscribe.length > 0) {
				await mqttClient.subscribeAsync(topicsToSubscribe, { qos: 1 })
				console.log(`Subscribed to topics: ${topicsToSubscribe.join(', ')}`)
			}
			// Broker connection timeout or other network issues
		} catch (error) {
			const errorStr: string =
				error instanceof Error ? error.message : String(error)
			if (errorStr.includes('Failed to connect')) {
				console.error(
					'Failed to initialize MQTT client: Connection timeout or network issue.',
				)
			}
			mqttClient = null
		} finally {
			activeRun = null
		}
	})()

	return activeRun
}
