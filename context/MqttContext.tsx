import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react'

import { fetchAuthSession } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'

import { areasQueryFn } from '@/queries/areas'
import { sendDeviceCommand } from '@/services/deviceCommands'
import {
	initMqtt,
	endMqtt,
	setMqttConnectionStateHandler,
	setMqttMessageHandler,
} from '@/services/mqtt'
import {
	notifyOtaUpdateIfCommand,
	publishOtaCommand,
	requestNotificationPermission,
	setOtaNotificationTapHandler,
} from '@/services/otaNotifications'
import { useAreaStore } from '@/stores/areaStore'
import type { MqttStatus } from '@/types/mqtt'

export interface MqttContextType {
	status: MqttStatus
	isReady: boolean
	reconnect: () => void
	requestStatusSnapshot: () => void
}
const MqttContext = createContext<MqttContextType | undefined>(undefined)

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [status, setStatus] = useState<MqttStatus>('DISCONNECTED')
	const [connectAttempt, setConnectAttempt] = useState(0)
	const clearAreas = useAreaStore((state) => state.clearAreas)

	// Function to request a status snapshot from all areas. Kept stable so the
	// connect effect below can depend on it without re-running every render.
	const requestStatusSnapshot = useCallback(() => {
		areasQueryFn()
			.then((areas) =>
				Promise.all(
					areas.map((area) =>
						sendDeviceCommand(area.key, {
							action: 'GetAllStatus',
							cause: 'Manual',
						}),
					),
				),
			)
			.catch((error) => console.error('[API] status snapshot failed:', error))
	}, [])

	useEffect(() => {
		let disposed = false

		const initializeForAuthenticatedUser = async () => {
			const { tokens } = await fetchAuthSession()
			if (disposed || !tokens?.idToken) {
				setStatus('DISCONNECTED')
				return
			}

			setStatus('CONNECTING')
			requestNotificationPermission()
			setOtaNotificationTapHandler(publishOtaCommand)
			setMqttMessageHandler((topic, rawMessage) => {
				useAreaStore.getState().handleIncomingMqtt(topic, rawMessage)
				notifyOtaUpdateIfCommand({
					topic,
					rawMessage,
					deviceKey: topic.split('/')[1] ?? '',
					version: '',
				})
			})
			setMqttConnectionStateHandler(setStatus)

			initMqtt()
				.then(() => {
					if (disposed) return
					setStatus('CONNECTED')
					// ESP presence is not retained, so a client that subscribes
					// after the device booted never sees the online ping. Ask every
					// device for a fresh snapshot on connect/reconnect so online
					// state and stations populate reliably.
					requestStatusSnapshot()
				})
				.catch((err) => {
					if (!disposed) {
						console.error('Provider initialization failed:', err)
						setStatus('ERROR')
					}
				})
		}

		void initializeForAuthenticatedUser()

		const unsubscribe = Hub.listen('auth', ({ payload }) => {
			if (payload.event === 'signedIn' || payload.event === 'tokenRefresh') {
				void initializeForAuthenticatedUser()
			}
			if (payload.event === 'signedOut') {
				setStatus('DISCONNECTED')
			}
		})

		return () => {
			disposed = true
			unsubscribe()
			setMqttConnectionStateHandler(null)
			// Close the socket on unmount/remount. Without this, a remount (Fast
			// Refresh, StrictMode, provider re-mount) leaves the old connection open
			// and opens a second one with the same client id; AWS IoT allows one
			// connection per client id, so the app flaps or times out on CONNACK.
			void endMqtt()
			// Clear areas on unmount to avoid stale data
			clearAreas()
		}
	}, [connectAttempt, clearAreas, requestStatusSnapshot])

	// Triggers a full teardown + re-init in the effect above, picking up
	// fresh MQTT credentials (and therefore fresh topic ACL claims)
	const reconnect = () => {
		console.log('Triggering MQTT reconnect to pick up fresh topic claims...')
		setStatus('CONNECTING')
		setConnectAttempt((prev) => prev + 1)
	}

	return (
		<MqttContext.Provider
			value={{
				status,
				isReady: status === 'CONNECTED',
				reconnect,
				requestStatusSnapshot,
			}}
		>
			{children}
		</MqttContext.Provider>
	)
}

export const useMqtt = () => {
	const context = useContext(MqttContext)
	if (!context) {
		throw new Error('useMqtt must be used within an MqttProvider')
	}
	return context
}
