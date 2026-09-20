export type MqttStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'
export type {
	DeviceAction as MqttAction,
	DeviceCause as MqttCause,
	DeviceCommand as MqttCommand,
} from './deviceCommand'
