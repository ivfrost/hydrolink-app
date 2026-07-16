export type MqttStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
export type MqttAction =
	| 'Start'
	| 'Stop'
	| 'GetStatus'
	| 'GetAllStatus'
	| 'SetType'
export type MqttCause = 'Manual' | 'Sensor' | 'Schedule' | 'Done'
export type MqttCommand = {
	action: MqttAction
	stationId: number
	cause: MqttCause
	durationMs?: string
	newStationType?: string
}
