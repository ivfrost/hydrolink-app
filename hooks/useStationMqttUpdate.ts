import { useCallback, useEffect } from 'react'

import { useMqtt } from '@/context/MqttContext'
import { StationType } from '@/types/area'

import { useAreaMqttData } from './useAreaMqttData'

export default function useStationMqttUpdate(
	areaKey: string,
	changeSet: Map<string, Record<number, string | undefined>>,
	send: (message: any) => void,
) {
	const mqtt = useMqtt()
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
		(stationId: number, field: string, newValue: string) => {
			const currentValue = allStations?.find((s) => s.id === stationId)?.[
				field as keyof (typeof allStations)[number]
			] as string | undefined

			if (currentValue === newValue) return

			// flushing last good known copy to API regularly, else there's no offline
			// access to these values.
			send({ type: 'SET_STATION_FIELD', stationId, field, newValue })
			if (field === 'type') {
				mqtt.setTypeForAreaStation(areaKey, stationId, newValue as StationType)
			} else if (field === 'name') {
				mqtt.setNameForAreaStation(areaKey, stationId, newValue)
			} else if (field === 'description') {
				mqtt.setDescriptionForAreaStation(areaKey, stationId, newValue)
			} else if (field === 'imageUrl') {
				mqtt.setImageUrlForAreaStation(areaKey, stationId, newValue)
			}
		},
		[mqtt, send, areaKey, allStations],
	)

	return {
		setNewValueForStation,
	}
}
