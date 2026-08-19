import { StationType } from '@/types/area'

export interface StationPickerOption {
	label: string
	value: StationType
}

export const STATION_TYPE_LABEL: Record<StationType, string> = {
	Solenoid: 'Solenoid',
	FertilizerPump: 'Fertilizer Pump',
	CaudalSensor: 'Caudal Sensor',
	HumiditySensor: 'Humidity Sensor',
	Unclassified: 'Unclassified',
}

// Sensor stations are read-only (no start/stop action) and are grouped
// separately from the actionable stations (solenoids and fertilizer pumps).
export const SENSOR_STATION_TYPES: readonly StationType[] = [
	'CaudalSensor',
	'HumiditySensor',
]

export const isSensorStationType = (type: StationType): boolean =>
	SENSOR_STATION_TYPES.includes(type)

export const isReadOnlyStationType = (type: StationType): boolean =>
	type === 'Unclassified' || isSensorStationType(type)

export const STATION_PICKER_OPTIONS: StationPickerOption[] = (
	Object.keys(STATION_TYPE_LABEL) as StationType[]
).map((value) => ({
	label: STATION_TYPE_LABEL[value],
	value,
}))

export enum AreaMenuOptionValue {
	Edit = 'edit',
	Unlink = 'unlink',
	Reboot = 'reboot',
	Connectivity = 'connectivity',
	OTAUpdate = 'OTA-update',
	Logs = 'logs',
}

export const getAreaMenuOptions = (
	isOnline: boolean,
): AreaMenuOptionValue[] => {
	const options: AreaMenuOptionValue[] = [AreaMenuOptionValue.Edit]

	if (isOnline) {
		options.push(AreaMenuOptionValue.Connectivity)
	}

	options.push(AreaMenuOptionValue.Unlink)

	if (isOnline) {
		options.push(AreaMenuOptionValue.Reboot, AreaMenuOptionValue.Logs)
	}

	return options
}

/**
 * Options shown in the header dropdown of the Areas tab screen.
 */
export const getAreasScreenHeaderOptions = (): AreaMenuOptionValue[] => [
	AreaMenuOptionValue.OTAUpdate,
]
