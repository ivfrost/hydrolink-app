import React, { createContext, useContext, useEffect, useState } from 'react'

import { initMqtt, mqttClient } from '@/services/mqtt'

type MqttStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'

interface MqttContextType {
	status: MqttStatus
	isReady: boolean
	lastMessage: { topic: string; message: string } | null
}

const MqttContext = createContext<MqttContextType | undefined>(undefined)

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [status, setStatus] = useState<MqttStatus>('DISCONNECTED')
	const [lastMessage, setLastMessage] = useState<{
		topic: string
		message: string
	} | null>(null)

	useEffect(() => {
		setStatus('CONNECTING')

		initMqtt()
			.then(() => {
				setStatus('CONNECTED')

				if (mqttClient) {
					mqttClient.on('message', (topic: string, payload: any) => {
						setLastMessage({
							topic,
							message: payload.toString(),
						})
					})

					mqttClient.on('close', () => {
						setStatus('DISCONNECTED')
					})

					mqttClient.on('error', () => {
						setStatus('ERROR')
					})
				}
			})
			.catch((err) => {
				console.error('Provider initialization failed:', err)
				setStatus('ERROR')
			})

		return () => {
			if (mqttClient) {
				mqttClient.end()
			}
		}
	}, [])

	return (
		<MqttContext.Provider
			value={{ status, isReady: status === 'CONNECTED', lastMessage }}
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
