import { Platform } from 'react-native'

import * as Burnt from 'burnt'
import * as Notifications from 'expo-notifications'

import { mqttClient } from '@/services/mqtt'
import { normalizeMqttPayload } from '@/utils/mqttPayload'

// Ensure notifications show as a heads-up banner while the app is foregrounded
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: false,
		shouldSetBadge: false,
	}),
})

const OTA_CHANNEL_ID = 'ota-updates'

/** Topic suffix the backend publishes OTA announcements on. */
const OTA_ANNOUNCE_SUFFIX = '/announce'
/** Topic suffix devices actually listen on for commands. */
const OTA_COMMAND_SUFFIX = '/command'

/**
 * Android 8.0+ requires a notification channel before any local notification
 * can be shown. Without this, scheduleNotificationAsync silently no-ops.
 */
async function ensureOtaChannel() {
	if (Platform.OS !== 'android') return
	const existing =
		await Notifications.getNotificationChannelAsync(OTA_CHANNEL_ID)
	if (existing) return
	await Notifications.setNotificationChannelAsync(OTA_CHANNEL_ID, {
		name: 'Firmware updates',
		importance: Notifications.AndroidImportance.HIGH,
		sound: null,
		vibrationPattern: null,
		lightColor: '#1b2a3b',
	})
}

/**
 * Callback invoked when the user taps an OTA notification. The app may be in
 * the foreground, background, or newly launched; `setOtaNotificationTapHandler`
 * registers the handler that re-publishes the stored OTA command back to the
 * device so flashing actually starts.
 */
let otaNotificationTapHandler:
	| ((topic: string, payload: string) => void)
	| null = null

// Retained messages redeliver on every subscribe — avoid re-notifying for
// the same firmware binary.
let lastNotifiedSha: string | null = null

/** Register the callback invoked when the user taps an OTA notification. */
export function setOtaNotificationTapHandler(
	handler: (topic: string, payload: string) => void,
) {
	otaNotificationTapHandler = handler
}

// Register the notification-tap listener exactly once. When the user taps a
// "Firmware update available" notification, re-publish the stored OTA command
// to the device command topic so it starts flashing immediately.
Notifications.addNotificationResponseReceivedListener((response) => {
	const data = response.notification.request.content.data as {
		commandTopic?: string
		rawMessage?: string
	}
	if (!data?.commandTopic || !data?.rawMessage) return

	if (!otaNotificationTapHandler) {
		console.warn('OTA notification tapped but no tap handler is registered yet')
		return
	}

	if (mqttClient && mqttClient.connected) {
		otaNotificationTapHandler(data.commandTopic, data.rawMessage)
	} else {
		console.warn(
			'OTA notification tapped but MQTT is not connected; cannot start update',
		)
	}
})

/** Ensure the app has permission to display local notifications. */
export async function requestNotificationPermission(): Promise<boolean> {
	if (Platform.OS === 'web') return false
	const { status } = await Notifications.getPermissionsAsync()
	if (status === 'granted') return true
	const { status: requested } = await Notifications.requestPermissionsAsync()
	return requested === 'granted'
}

export type OtaUpdateInfo = {
	topic: string
	rawMessage: string
	/** Short label identifying the device, e.g. HYDRO-9E9488 */
	deviceKey: string
	/** Version advertised by the backend command payload, e.g. v1.0.0 */
	version?: string
}

/**
 * If the MQTT message is an OTA announcement (topic ends in /announce),
 * present a native notification whose tap sends the actual command to the
 * device's /command topic.
 */
export async function notifyOtaUpdateIfCommand(
	info: OtaUpdateInfo,
): Promise<void> {
	const { topic, rawMessage: incomingMessage, deviceKey, version } = info

	if (!topic.endsWith(OTA_ANNOUNCE_SUFFIX)) return
	const commandTopic =
		topic.slice(0, -OTA_ANNOUNCE_SUFFIX.length) + OTA_COMMAND_SUFFIX

	// Normalize the payload (services/mqtt.ts already does this, but be
	// defensive here too so a valid announce is never dropped).
	const rawMessage = normalizeMqttPayload(incomingMessage)

	let command: { action?: string; binUrl?: string; version?: string }
	try {
		command = JSON.parse(rawMessage)
	} catch {
		console.warn('[OTA] announce payload is not valid JSON:', rawMessage)
		return
	}

	// Log the full payload so a mismatch (wrong action name or a missing
	// binUrl field, e.g. server sending `objectKey` instead) is visible
	// instead of silently dropping the notification.
	console.log('[OTA] announce received on', topic, '->', command)

	if (command.action !== 'OTAUpdate' || !command.binUrl) {
		console.warn(
			'[OTA] announce ignored: expected { action: "OTAUpdate", binUrl } but got:',
			command,
		)
		return
	}

	// Skip if we already notified for this exact firmware binary.
	// Retained messages redeliver on every MQTT subscribe, so without
	// this the user gets spammed on every reconnect.
	const sha = (command as { sha256?: string }).sha256
	if (sha && sha === lastNotifiedSha) return
	lastNotifiedSha = sha ?? null

	const granted = await requestNotificationPermission()
	if (!granted) {
		console.warn(
			'[OTA] notification permission not granted; cannot show notification.',
		)
		Burnt.toast({
			title: 'Firmware update available',
			message:
				'Enable notifications for Hydrolink in system settings to receive firmware update alerts.',
			preset: 'error',
		})
		return
	}

	await ensureOtaChannel()

	// Diagnostic: surface the actual OS permission + channel state so a
	// notification that is scheduled but never displayed can be traced.
	if (Platform.OS === 'android') {
		const permission = await Notifications.getPermissionsAsync()
		const channel =
			await Notifications.getNotificationChannelAsync(OTA_CHANNEL_ID)
		console.log('[OTA] android permission:', permission.status)
		console.log(
			'[OTA] channel:',
			channel?.id,
			'| importance:',
			channel?.importance,
		)
	}

	const deviceLabel = deviceKey || topic.split('/')[1] || 'device'
	const versionLabel = version || command.version || 'new'

	console.log('[OTA] scheduling notification now')

	try {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: 'Firmware update available',
				body: `${deviceLabel} has a new firmware (v${versionLabel}). Tap to install now.`,
				data: { commandTopic, rawMessage },
				sound: false,
			},
			// Show immediately on the HIGH-importance "Firmware updates"
			// channel, so the notification is posted to that channel instead
			// of the SDK's generic fallback channel.
			trigger: { channelId: OTA_CHANNEL_ID },
		})
		console.log('[OTA] notification scheduled')
	} catch (error) {
		console.error('[OTA] failed to schedule notification:', error)
	}
}

/** Publish a stored OTA command to its topic. */
export function publishOtaCommand(topic: string, rawMessage: string) {
	if (mqttClient && mqttClient.connected) {
		mqttClient.publish(topic, rawMessage, { qos: 1 })
		console.log(`Re-publishing OTA command to ${topic}`)
	} else {
		console.warn('Cannot re-publish OTA command: MQTT disconnected')
	}
}
