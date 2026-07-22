export type MqttStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
export type MqttAction =
	| 'Start'
	| 'Stop'
	| 'Reboot'
	| 'GetStatus'
	| 'GetAllStatus'
	| 'SetType'
	| 'SetName'
	| 'SetDescription'
	| 'SetImageUrl'
export type MqttCause = 'Manual' | 'Sensor' | 'Schedule' | 'Done'
export type MqttCommand = {
	action: MqttAction
	stationId: number
	cause: MqttCause
	durationMs?: number
	type?: string
	name?: string
	description?: string
	imageUrl?: string
}
