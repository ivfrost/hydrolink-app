import type { TimeWindowRequest } from './schedule'

export type DeviceAction =
	| 'Start'
	| 'Stop'
	| 'Reboot'
	| 'GetStatus'
	| 'GetAllStatus'
	| 'SetSecret'
	| 'SetType'
	| 'SetName'
	| 'SetDescription'
	| 'SetImage'
	| 'OtaUpdate'
	| 'SetSchedule'

export type DeviceCause = 'Manual' | 'Sensor' | 'Schedule' | 'Done'

export type DeviceCommand = {
	action: DeviceAction
	cause: DeviceCause
	stationId?: number
	durationMs?: number
	type?: string
	name?: string
	description?: string
	secret?: string
	imageUrl?: string
	binUrl?: string
	date?: string
	windows?: TimeWindowRequest[]
}
