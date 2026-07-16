import { StationType } from '@/types/area'

export interface StationPickerOption {
	label: string
	value: StationType
}

export const STATION_PICKER_OPTIONS: StationPickerOption[] = [
	{ label: 'Solenoid', value: 'Solenoid' },
	{ label: 'Pump', value: 'Pump' },
	{ label: 'Fertilizer', value: 'Fertilizer' },
	{ label: 'Sensor', value: 'Sensor' },
	{ label: 'Unclassified', value: 'Unknown' },
]
