import { useCallback } from 'react'

import * as Burnt from 'burnt'

import { isReadOnlyStationType } from '@/data/area'
import { sendDeviceCommand } from '@/services/deviceCommands'
import { StationAction } from '@/types/area'

import { useAreaMqttData } from './useAreaMqttData'

export default function useStationAction(
	areaKey: string,
	send: (event: any) => void,
	pendingStationActions: Record<number, { targetState: 'Running' | 'Idle' }>,
) {
	const { allStations, activeSolenoid } = useAreaMqttData(areaKey)

	// Check state machine context passed from screen
	const isStationActionPending = useCallback(
		(stationId: number) => {
			return stationId in pendingStationActions
		},
		[pendingStationActions],
	)

	// Function to initiate a station action
	const initiateStationAction = useCallback(
		async (stationId: number, action: StationAction) => {
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
				console.warn(`Station ${stationId} is already running. Start not sent.`)
				return
			}
			if (action.action === 'Stop' && currentStation.status.state === 'Idle') {
				console.warn(`Station ${stationId} is already idle. Stop not sent.`)
				return
			}

			const targetState = action.action === 'Start' ? 'Running' : 'Idle'

			const command = {
				action: action.action,
				stationId,
				cause: action.cause,
				durationMs: action.durationMs,
			}

			try {
				await sendDeviceCommand(areaKey, command)
			} catch (error) {
				console.error(`Failed to send command to ${areaKey}:`, error)
				Burnt.toast({ title: 'Could not send command', preset: 'error' })
				return
			}

			// API acceptance is not device confirmation. The state machine remains
			// pending until the MQTT status stream reports the target state.
			send({
				type: 'INITIATE_STATION_ACTION',
				stationId,
				targetState,
			})

			Burnt.toast({
				title: `Sent ${action.action} command to station ${stationId + 1}`,
				preset: 'done',
			})
		},
		[areaKey, allStations, send, pendingStationActions],
	)

	// Helper for action button state management
	const isActionButtonDisabled = useCallback(
		(stationId: number) => {
			const station = Array.isArray(allStations)
				? allStations.find((s) => s.id === stationId)
				: (allStations as Record<number, any>)[stationId]

			const stationType = station?.type
			const isPendingAction = isStationActionPending(stationId)

			if (stationType && isReadOnlyStationType(stationType)) return true
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
