import { StationType } from '@/types/area'

export interface StationPickerOption {
	label: string
	value: StationType
}

export const STATION_PICKER_OPTIONS: StationPickerOption[] = [
	{ label: 'Solenoid', value: 'Solenoid' },
	{ label: 'Fertilizer', value: 'Fertilizer' },
	{ label: 'Sensor', value: 'Sensor' },
	{ label: 'Unclassified', value: 'Unknown' },
]

export enum AreaMenuOptionValue {
	Edit = 'edit',
	Unlink = 'unlink',
	Reboot = 'reboot',
	Connectivity = 'connectivity',
}

export const getAreaMenuOptions = (
	isOnline: boolean,
): Map<string, AreaMenuOptionValue[]> => {
	const options = new Map<string, AreaMenuOptionValue[]>()

	// Always allow edit/unlink
	options.set('General', [AreaMenuOptionValue.Edit, AreaMenuOptionValue.Unlink])

	if (isOnline) {
		// If online, add connectivity + maintenance actions
		options.set('Connectivity', [AreaMenuOptionValue.Connectivity])
		options.set('Maintenance', [AreaMenuOptionValue.Reboot])
	}

	return options
}
export type AreaMenuOption = {
	label: string
	value: AreaMenuOptionValue
	header?: string
}
