import { Platform } from 'react-native'

import * as Application from 'expo-application'
import * as SecureStore from 'expo-secure-store'
import mqtt from 'mqtt'

import { getMqttCredentials } from '@/queries/auth'
import { decodeJwt } from '@/utils/decodeJwt'

export let mqttClient: any = null
export let publishableTopics: string[] = []
let activeRun: Promise<void> | null = null
let rerunQueued = false

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

			if (topicsToSubscribe.length > 0) {
				await mqttClient.subscribeAsync(topicsToSubscribe, { qos: 1 })
				console.log(`Subscribed to topics: ${topicsToSubscribe.join(', ')}`)
			}
		} catch (error) {
			console.error('Failed to initialize MQTT:', error)
			mqttClient = null
			throw error
		} finally {
			activeRun = null
		}
	})()

	return activeRun
}
