import type { DeviceCommand } from '@/types/deviceCommand'
import apiFetch from '@/utils/apiFetch'

export type { DeviceCommand } from '@/types/deviceCommand'

/** Send a device command through the authenticated Hydro API. */
export async function sendDeviceCommand(
	deviceKey: string,
	command: DeviceCommand,
): Promise<void> {
	if (!deviceKey) throw new Error('A device key is required to send a command')

	await apiFetch<void>(`/devices/${encodeURIComponent(deviceKey)}/command`, {
		method: 'POST',
		body: JSON.stringify(command),
	})
}
