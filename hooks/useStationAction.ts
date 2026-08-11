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
			// Ignore commands for a station that already has an in-flight
			// action. This guards against rapid taps before the machine
			// re-renders the pending state and keeps multiple quick starts
			// from publishing overlapping commands.
			if (stationId in pendingStationActions) {
				console.warn(
					`Station ${stationId} already has a pending action. Ignoring new action.`,
				)
				return
			}

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
		[areaKey, publish, allStations, send, pendingStationActions],
	)

	// Helper for action button state management
	const isActionButtonDisabled = useCallback(
		(stationId: number) => {
			const station = Array.isArray(allStations)
				? allStations.find((s) => s.id === stationId)
				: (allStations as Record<number, any>)[stationId]

			const stationType = station?.type
			const isPendingAction = isStationActionPending(stationId)

			if (stationType === 'Unknown' || stationType === 'Sensor') return true
			if (isPendingAction) return true

			if (stationType === 'Solenoid') {
				// Only one solenoid per area: block starting a solenoid while
				// another one is running OR has a pending start (before the
				// ESP confirms it).
				const anotherSolenoidPendingStart = Object.entries(
					pendingStationActions,
				).some(([pendingId, pending]) => {
					if (Number(pendingId) === stationId) return false
					if (pending.targetState !== 'Running') return false
					const pendingStation = Array.isArray(allStations)
						? allStations.find((s) => s.id === Number(pendingId))
						: (allStations as Record<number, any>)[Number(pendingId)]
					return pendingStation?.type === 'Solenoid'
				})
				const isAnotherSolenoidActive =
					(activeSolenoid !== undefined && activeSolenoid.id !== stationId) ||
					anotherSolenoidPendingStart
				if (isAnotherSolenoidActive) return true
			}

			return false
		},
		[
			allStations,
			activeSolenoid,
			isStationActionPending,
			pendingStationActions,
		],
	)

	return {
		initiateStationAction,
		isActionButtonDisabled,
		isStationActionPending,
	}
}
