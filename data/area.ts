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

export enum AreaMenuOptionValue {
	Edit = 'edit',
	Unlink = 'unlink',
	Reboot = 'reboot',
	Connectivity = 'connectivity',
}

export const getAreaMenuOptions = (
	isOnline: boolean,
	isSameNetwork: boolean = false,
): Map<string, AreaMenuOptionValue[]> => {
	const options = new Map<string, AreaMenuOptionValue[]>()

	// Always allow edit/unlink
	options.set('General', [AreaMenuOptionValue.Edit, AreaMenuOptionValue.Unlink])

	if (isOnline) {
		// If online, add connectivity actions
		options.set('Connectivity', [AreaMenuOptionValue.Connectivity])

		if (isSameNetwork) {
			// If same network, allow reboot
			options.set('Maintenance', [AreaMenuOptionValue.Reboot])
		}
	}

	return options
}
export type AreaMenuOption = {
	label: string
	value: AreaMenuOptionValue
	header?: string
}
