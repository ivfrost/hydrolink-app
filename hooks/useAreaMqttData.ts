import { useMemo } from 'react'

import { useAreaStore } from '@/stores/areaStore'
import { Station } from '@/types/area'

export function useAreaMqttData(areaKey: string | undefined) {
	const mqttAreas = useAreaStore((state) => state.areas)
	const mqttAreaData = mqttAreas[areaKey ?? '']
	const order = useAreaStore(
		(state) => state.stationDisplayOrder[areaKey ?? ''],
	)
	const manualOverrides = useAreaStore(
		(state) => state.getManualOverrideForStation,
	)

	const stations = useMemo(
		() => Object.values(mqttAreaData?.stations || {}),
		[mqttAreaData],
	)

	const stationMap = useMemo(
		() => new Map(stations.map((s) => [s.id, s])),
		[stations],
	)

	const sortedStations = useMemo(() => {
		if (!order || order.length === 0) {
			return stations
		}

		const ordered = order
			.map((id) => stationMap.get(id))
			.filter((s): s is Station => s !== undefined)

		const missing = stations.filter((s) => !order.includes(s.id))

		return [...ordered, ...missing]
	}, [stations, order, stationMap])

	const grouped = useMemo(
		() => ({
			allStations: sortedStations,
			solenoids: sortedStations.filter((s) => s.type === 'Solenoid'),
			pumps: sortedStations.filter((s) => s.type === 'Pump'),
			fertilizers: sortedStations.filter((s) => s.type === 'Fertilizer'),
			sensors: sortedStations.filter((s) => s.type === 'Sensor'),
			unclassified: sortedStations.filter((s) => s.type === 'Unknown'),
		}),
		[sortedStations],
	)

	const activeSolenoid = useMemo(
		() => grouped.solenoids.find((s) => s.status.state === 'Running'),
		[grouped.solenoids],
	)

	// Stations order on drag-and-drop is persisted in the store, not synced
	// with the API or the ESP.
	const sortStations = useAreaStore((state) => state.setStationDisplayOrder)

	return {
		...grouped,
		activeSolenoid,
		isAreaOnline: mqttAreaData?.online ?? false,
		lastUpdatedStr: mqttAreaData?.lastUpdated || 'Never',
		mqttAreaData,
		manualOverrides,
		sortStations,
	}
}
