import { useCallback, useEffect } from 'react'

import { sendDeviceCommand } from '@/services/deviceCommands'
import { useAreaStore } from '@/stores/areaStore'

import { useAreaMqttData } from './useAreaMqttData'

export default function useStationMqttUpdate(
	areaKey: string,
	changeSet: Map<string, Record<number, string | undefined>>,
	send: (message: any) => void,
) {
	const { allStations } = useAreaMqttData(areaKey)

	// On MQTT message, if there is a pending station field change and it has
	// been confirmed by the ESP, notify the state machine.
	useEffect(() => {
		if (!allStations) return

		for (const [field, pendingByStation] of changeSet) {
			allStations.forEach((station) => {
				const pendingValue = pendingByStation[station.id]
				const liveValue = station[field as keyof typeof station]

				if (pendingValue && pendingValue === liveValue) {
					send({
						type: 'STATION_STATUS_UPDATE',
						field,
						stationId: station.id,
						newValue: liveValue,
					})
				}
			})
		}
	}, [allStations, changeSet, send])

	// Handler for setting each field of a station over MQTT
	// ESP publishes the new state back to the MQTT topic, store updates the UI
	// TODO: might be worth saving directly to API in a future, or at least
	const setNewValueForStation = useCallback(
		async (
			stationId: number,
			field: 'type' | 'name' | 'description' | 'imageUrl',
			newValue: string,
		): Promise<boolean> => {
			const currentValue = allStations?.find((s) => s.id === stationId)?.[
				field as keyof (typeof allStations)[number]
			] as string | undefined

			if (currentValue === newValue) return false

			const action =
				field === 'imageUrl'
					? 'SetImage'
					: `Set${field[0].toUpperCase()}${field.slice(1)}`
			try {
				await sendDeviceCommand(areaKey, {
					action: action as
						| 'SetType'
						| 'SetName'
						| 'SetDescription'
						| 'SetImage',
					stationId,
					cause: 'Manual',
					...(field === 'type' ? { type: newValue } : {}),
					...(field === 'name' ? { name: newValue } : {}),
					...(field === 'description' ? { description: newValue } : {}),
					...(field === 'imageUrl' ? { imageUrl: newValue } : {}),
				})
			} catch (error) {
				console.error(`Failed to update ${field} for ${areaKey}:`, error)
				return false
			}

			send({ type: 'SET_STATION_FIELD', stationId, field, newValue })
			useAreaStore
				.getState()
				.setStationField(areaKey, stationId, field, newValue)

			return true
		},
		[send, areaKey, allStations],
	)

	return {
		setNewValueForStation,
	}
}
