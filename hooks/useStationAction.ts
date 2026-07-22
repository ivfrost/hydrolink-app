import { useCallback } from 'react'

import * as Burnt from 'burnt'

import { useMqtt } from '@/context/MqttContext'
import { publishableTopics } from '@/services/mqtt'
import { StationAction } from '@/types/area'
import { MqttCommand } from '@/types/mqtt'
import { getCommandTopic } from '@/utils/mqttTopics'

import { useAreaMqttData } from './useAreaMqttData'

export default function useStationAction(
	areaKey: string,
	send: (event: any) => void,
	pendingStationActions: Record<number, { targetState: 'Running' | 'Idle' }>,
) {
	const { allStations, activeSolenoid } = useAreaMqttData(areaKey)
	const { publish } = useMqtt()

	// Check state machine context passed from screen
	const isStationActionPending = useCallback(
		(stationId: number) => {
			return stationId in pendingStationActions
		},
		[pendingStationActions],
	)

	// Function to initiate a station action
	const initiateStationAction = useCallback(
		(stationId: number, action: StationAction) => {
			const currentStation = Array.isArray(allStations)
				? allStations.find((s) => s.id === stationId)
				: (allStations as Record<number, any>)[stationId]

			if (!currentStation) {
				console.error(
					`Station ${stationId} not found in allStations. Action not sent.`,
				)
				return
			}

			if (
				action.action === 'Start' &&
				currentStation.status.state === 'Running'
			) {
				console.warn(
					`Station ${stationId} is already in target state: Running. Action not sent.`,
				)
				return
			}
			if (action.action === 'Stop' && currentStation.status.state === 'Idle') {
				console.warn(
					`Station ${stationId} is already in target state: Idle. Action not sent.`,
				)
				return
			}

			const targetState = action.action === 'Start' ? 'Running' : 'Idle'

			// Tell machine to mark action as pending in context
			send({
				type: 'INITIATE_STATION_ACTION',
				stationId,
				targetState,
			})

			const command: MqttCommand = {
				action: action.action,
				stationId: stationId,
				cause: action.cause,
				durationMs: action.durationMs,
			}
			const serializedCommand = JSON.stringify(command)
			const areaTopic = publishableTopics.find((topic) =>
				topic.includes(areaKey),
			)
			if (!areaTopic) {
				console.error(`No publishable topic found for areaKey: ${areaKey}`)
				return
			}
			publish(getCommandTopic(areaTopic), serializedCommand)

			Burnt.toast({
				title: `Sent ${action.action} command to station ${stationId + 1}`,
				preset: 'done',
			})
		},
		[areaKey, publish, allStations, send],
	)

	// Helper for action button state management
	const isActionButtonDisabled = useCallback(
		(stationId: number) => {
			const station = Array.isArray(allStations)
				? allStations.find((s) => s.id === stationId)
				: (allStations as Record<number, any>)[stationId]

			const stationType = station?.type
			const isPendingAction = isStationActionPending(stationId)

			if (stationType === 'Unknown') return true
			if (isPendingAction) return true

			if (stationType === 'Solenoid') {
				const isAnotherSolenoidActive =
					activeSolenoid !== undefined && activeSolenoid.id !== stationId
				if (isAnotherSolenoidActive) return true
			}

			return false
		},
		[allStations, activeSolenoid, isStationActionPending],
	)

	return {
		initiateStationAction,
		isActionButtonDisabled,
		isStationActionPending,
	}
}
