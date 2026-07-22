import { useState } from 'react'

import { AreaDbData, AreaMqttData, AreaUpdatePayload } from '@/types/area'

function buildInitialAreaUpdatePayload(
	dbArea: AreaDbData,
	mqttArea: AreaMqttData,
): AreaUpdatePayload {
	const stations = Object.fromEntries(
		Object.entries(mqttArea.stations).map(([id, station]) => [
			id,
			{
				name: station.name,
				type: station.type,
				imageUrl: mqttArea.stations?.[Number(id)]?.imageUrl,
			},
		]),
	)

	return {
		friendlyName: dbArea.friendlyName,
		location: dbArea.location,
		description: dbArea.description,
		imageUrl: dbArea.imageUrl,
		stations,
	}
}

export default function useAreaEditForm(
	areaKey: string,
	pendingStationTypeChange: Record<number, string | undefined>,
	send: (message: any) => void,
) {
	const [formData, setFormData] = useState<AreaUpdatePayload>(() =>
		buildInitialAreaUpdatePayload(dbAreaData, mqttAreaData),
	)

	const handleFormChange = (updatedData: Partial<AreaUpdatePayload>) => {
		setFormData((prev) => ({
			...prev,
			...updatedData,
		}))
	}

	return {
		formData,
		handleFormChange,
		setFormData,
	}
}
