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
	rebootArea: (areaKey: string) => void
	setTypeForAreaStation: (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => void
	setNameForAreaStation: (
		areaKey: string,
		stationId: number,
		name: string,
	) => void
	setDescriptionForAreaStation: (
		areaKey: string,
		stationId: number,
		description: string,
	) => void
	setImageUrlForAreaStation: (
		areaKey: string,
		stationId: number,
		imageUrl: string,
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
		const init = async () => {
			setStatus('CONNECTING')
		}
		init()
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
						useAreaStore.getState().handleIncomingMqtt(topic, rawMessage)
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
	}, [connectAttempt, clearAreas])

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

	// Function to reboot a specific area
	const rebootArea = (areaKey: string) => {
		if (!mqttClient || !mqttClient.connected) {
			console.warn('Cannot reboot area, MQTT client is not connected.')
			return
		}

		const topic = publishableTopics.find(
			(t) => t.includes(`/${areaKey}/`) && t.endsWith('/#'),
		)

		if (!topic) {
			console.warn(`Cannot reboot area: no MQTT topic for area ${areaKey}`)
			return
		}

		const commandTopic = getCommandTopic(topic)

		const cmd: MqttCommand = {
			action: 'Reboot',
			stationId: -1,
			cause: 'Manual',
		}
		console.log(`Publishing Reboot command to ${commandTopic}:`, cmd)
		publish(commandTopic, JSON.stringify(cmd))
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

		const commandTopic = getCommandTopic(topic)

		const cmd: MqttCommand = {
			action: 'SetType',
			stationId,
			type,
			cause: 'Manual',
		}
		console.log(`Publishing SetType command to ${commandTopic}:`, cmd)
		publish(commandTopic, JSON.stringify(cmd))
	}

	// Function to set the name of a specific station in a specific area
	const setNameForAreaStation = (
		areaKey: string,
		stationId: number,
		name: string,
	) => {
		if (!mqttClient || !mqttClient.connected) return

		const topic = publishableTopics.find(
			(t) => t.includes(`/${areaKey}/`) && t.endsWith('/#'),
		)

		if (!topic) {
			console.warn(`Cannot set name: no MQTT topic for area ${areaKey}`)
			return
		}

		const commandTopic = getCommandTopic(topic)

		const cmd: MqttCommand = {
			action: 'SetName',
			stationId,
			name,
			cause: 'Manual',
		}
		console.log(`Publishing SetName command to ${commandTopic}:`, cmd)
		publish(commandTopic, JSON.stringify(cmd))
	}

	// Function to set the description of a specific station in a specific area
	const setDescriptionForAreaStation = (
		areaKey: string,
		stationId: number,
		description: string,
	) => {
		if (!mqttClient || !mqttClient.connected) return

		const topic = publishableTopics.find(
			(t) => t.includes(`/${areaKey}/`) && t.endsWith('/#'),
		)

		if (!topic) {
			console.warn(`Cannot set description: no MQTT topic for area ${areaKey}`)
			return
		}

		const commandTopic = getCommandTopic(topic)

		const cmd: MqttCommand = {
			action: 'SetDescription',
			stationId,
			description,
			cause: 'Manual',
		}
		console.log(`Publishing SetDescription command to ${commandTopic}:`, cmd)
		publish(commandTopic, JSON.stringify(cmd))
	}

	// Function to set the image URL of a specific station in a specific area
	const setImageUrlForAreaStation = (
		areaKey: string,
		stationId: number,
		imageUrl: string,
	) => {
		if (!mqttClient || !mqttClient.connected) return

		const topic = publishableTopics.find(
			(t) => t.includes(`/${areaKey}/`) && t.endsWith('/#'),
		)

		if (!topic) {
			console.warn(`Cannot set image URL: no MQTT topic for area ${areaKey}`)
			return
		}

		const commandTopic = getCommandTopic(topic)

		const cmd: MqttCommand = {
			action: 'SetImageUrl',
			stationId,
			imageUrl,
			cause: 'Manual',
		}
		console.log(`Publishing SetImageUrl command to ${commandTopic}:`, cmd)
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
				rebootArea,
				setTypeForAreaStation,
				setNameForAreaStation,
				setDescriptionForAreaStation,
				setImageUrlForAreaStation,
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
