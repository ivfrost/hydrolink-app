import { Platform } from 'react-native'

import * as Application from 'expo-application'
import * as SecureStore from 'expo-secure-store'
import mqtt from 'mqtt'

import { getMqttCredentials } from '@/queries/auth'
import { decodeJwt } from '@/utils/decodeJwt'

let isMqttInitialized = false
export let mqttClient: any = null

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
	if (isMqttInitialized) return

	try {
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

		console.log(
			`Initializing MQTT with client ID: ${clientId}, user ID: ${userId}`,
		)

		// Use connectAsync to meet the required v5 instantiation flow
		console.log(`Connecting to MQTT broker at: ${brokerUrlStr}`)
		mqttClient = await mqtt.connectAsync(brokerUrlStr, {
			clientId,
			username: String(userId),
			password: mqttToken,
			clean: true,
			connectTimeout: 5000,
			reconnectPeriod: 2000,
		})

		if (topicsToSubscribe.length > 0) {
			await mqttClient.subscribeAsync(topicsToSubscribe)
			console.log(`Subscribed to topics: ${topicsToSubscribe.join(', ')}`)
		}

		isMqttInitialized = true
	} catch (error) {
		console.error('Failed to initialize MQTT:', error)
		isMqttInitialized = false
		throw error
	}
}

export default {
	initMqtt,
}
