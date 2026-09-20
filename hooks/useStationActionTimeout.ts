import { useEffect, useRef } from 'react'

import * as Burnt from 'burnt'

/**
 * A station action is fire-and-forget: the API accepts the command and the UI
 * waits for the device to confirm the new state over MQTT. If the device never
 * reports (offline, command dropped because it is not retained, a rejected
 * start), the pending state would otherwise sit forever and the button would
 * spin indefinitely. This clears the pending action after a deadline and tells
 * the user the device did not confirm.
 */
const STATION_ACTION_TIMEOUT_MS = 20000

export default function useStationActionTimeout(
	pendingStationActions: Record<number, { targetState: 'Running' | 'Idle' }>,
	send: (event: any) => void,
) {
	const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

	useEffect(() => {
		// Clear timers for stations that are no longer pending (confirmed).
		for (const key of Object.keys(timers.current)) {
			const stationId = Number(key)
			if (!(stationId in pendingStationActions)) {
				clearTimeout(timers.current[stationId])
				delete timers.current[stationId]
			}
		}

		// Arm a deadline for each newly pending station.
		for (const key of Object.keys(pendingStationActions)) {
			const stationId = Number(key)
			if (timers.current[stationId]) continue

			timers.current[stationId] = setTimeout(() => {
				delete timers.current[stationId]
				Burnt.toast({
					title: 'No confirmation from device',
					message: 'The station did not report the new state.',
					preset: 'error',
				})
				send({ type: 'STATION_ACTION_TIMEOUT', stationId })
			}, STATION_ACTION_TIMEOUT_MS)
		}
	}, [pendingStationActions, send])

	// Clear any outstanding timers on unmount.
	useEffect(
		() => () => {
			for (const timer of Object.values(timers.current)) clearTimeout(timer)
			timers.current = {}
		},
		[],
	)
}
