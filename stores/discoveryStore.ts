import { create } from 'zustand'

interface DiscoveredDevice {
	host: string
	port: number
	deviceKey: string
	lastSeen?: number
}

interface DiscoveryState {
	devices: Map<string, DiscoveredDevice>
	addDevice: (device: DiscoveredDevice) => void
	removeDevice: (deviceKey: string) => void
	clear: () => void
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
	devices: new Map(),
	addDevice: (device) =>
		set((state) => ({
			devices: new Map(state.devices).set(device.deviceKey, device),
		})),
	removeDevice: (deviceKey) =>
		set((state) => {
			const newDevices = new Map(state.devices)
			newDevices.delete(deviceKey)
			return { devices: newDevices }
		}),
	clear: () => set({ devices: new Map() }),
}))
