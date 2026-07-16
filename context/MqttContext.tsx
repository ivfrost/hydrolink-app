import React, { createContext, useContext, useEffect, useState } from 'react'

import { initMqtt, mqttClient, publishableTopics } from '@/services/mqtt'
import { useAreaStore } from '@/stores/areaStore'
import { StationType } from '@/types/area'
import type { MqttCommand, MqttStatus } from '@/types/mqtt'
import { getCommandTopic } from '@/utils/mqttTopics'

export interface MqttContextType {
	status: MqttStatus
	isReady: boolean
	publish: (topic: string, message: string) => void
	publishableTopics: string[]
	reconnect: () => void
	requestStatusSnapshot: () => void
	setTypeForAreaStation: (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => void
}
const MqttContext = createContext<MqttContextType | undefined>(undefined)

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [status, setStatus] = useState<MqttStatus>('DISCONNECTED')
	const [publishableTopicState, setPublishableTopicState] = useState<string[]>(
		[],
	)
	const [connectAttempt, setConnectAttempt] = useState(0)
	const clearAreas = useAreaStore((state) => state.clearAreas)

	useEffect(() => {
		setStatus('CONNECTING')

		let cleanupListeners: (() => void) | undefined

		initMqtt()
			.then(() => {
				setStatus('CONNECTED')
				// publishableTopics is a global variable set by initMqtt()
				setPublishableTopicState(publishableTopics)

				if (mqttClient) {
					const handleMessage = (topic: string, payload: any) => {
						const rawMessage = payload.toString()
						// The area store parses the message and updates areas accordingly
						useAreaStore.getState().handleIcomingMqtt(topic, rawMessage)
					}
					const handleClose = () => setStatus('DISCONNECTED')
					const handleConnect = () => setStatus('CONNECTED')
					const handleError = () => setStatus('ERROR')

					mqttClient.on('connect', handleConnect)
					mqttClient.on('message', handleMessage)
					mqttClient.on('close', handleClose)
					mqttClient.on('error', handleError)

					// Ensure listener cleanup on unmount or re-init
					cleanupListeners = () => {
						if (mqttClient) {
							mqttClient.off('connect', handleConnect)
							mqttClient.off('message', handleMessage)
							mqttClient.off('close', handleClose)
							mqttClient.off('error', handleError)
						}
					}

					// Request an initial status snapshot from every subscribed area
					publishableTopics.forEach((topic) => {
						mqttClient.publish(
							getCommandTopic(topic),
							JSON.stringify({
								action: 'GetAllStatus',
								stationId: -1,
								cause: 'Manual',
							}),
						)
					})
				}
			})
			.catch((err) => {
				console.error('Provider initialization failed:', err)
				setStatus('ERROR')
			})

		return () => {
			cleanupListeners?.()
			// Clear areas on unmount to avoid stale data
			clearAreas()
		}
	}, [connectAttempt])

	// Function to publish messages to the MQTT broker
	// Expects message to be a JSON stringified MqttCommand object
	const publish = (topic: string, message: string) => {
		if (!mqttClient || !mqttClient.connected) {
			console.warn('Cannot publish message, MQTT client is not connected.')
			return
		}

		mqttClient.publish(topic, message, { qos: 1 })
	}

	// Triggers a full teardown + re-init in the effect above, picking up
	// fresh MQTT credentials (and therefore fresh topic ACL claims)
	const reconnect = () => {
		console.log('Triggering MQTT reconnect to pick up fresh topic claims...')
		setStatus('CONNECTING')
		setConnectAttempt((prev) => prev + 1)
	}

	// Function to request a status snapshot from all areas
	const requestStatusSnapshot = () => {
		if (mqttClient && mqttClient.connected) {
			publishableTopics.forEach((topic) => {
				publish(
					getCommandTopic(topic),
					JSON.stringify({
						action: 'GetAllStatus',
						stationId: -1,
						cause: 'Manual',
					}),
				)
			})
		} else {
			console.warn(
				'Cannot request status snapshot, MQTT client is not connected.',
			)
		}
	}

	// Function to set the type of a specific station in a specific area
	const setTypeForAreaStation = (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => {
		if (!mqttClient || !mqttClient.connected) return

		const topic = publishableTopics.find(
			(t) => t.includes(`/${areaKey}/`) && t.endsWith('/#'),
		)

		if (!topic) {
			console.warn(`Cannot set type: no MQTT topic for area ${areaKey}`)
			return
		}

		const commandTopic = topic.replace(/\/#$/, '/command')

		const cmd: MqttCommand = {
			action: 'SetType',
			stationId,
			newStationType: type,
			cause: 'Manual',
		}
		console.log(`Publishing SetType command to ${commandTopic}:`, cmd)
		publish(commandTopic, JSON.stringify(cmd))
	}

	return (
		<MqttContext.Provider
			value={{
				status,
				isReady: status === 'CONNECTED',
				publish,
				publishableTopics: publishableTopicState,
				reconnect,
				requestStatusSnapshot,
				setTypeForAreaStation,
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
