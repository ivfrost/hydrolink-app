import { useEffect, useRef } from 'react'
import Zeroconf from 'react-native-zeroconf'

import { useDiscoveryStore } from '@/stores/discoveryStore'

const STALE_MS = 45000
const RESCAN_INTERVAL_MS = 20000
const PRUNE_CHECK_INTERVAL_MS = 10000

export function useLocalDiscovery() {
	const zeroconfRef = useRef<Zeroconf | null>(null)
	const nameToKeyRef = useRef(new Map<string, string>())

	useEffect(() => {
		const zeroconf = new Zeroconf()
		zeroconfRef.current = zeroconf

		zeroconf.on('resolved', (service) => {
			if (service.txt?.device_key) {
				nameToKeyRef.current.set(service.name, service.txt.device_key)
				useDiscoveryStore.getState().addDevice({
					host: service.host,
					port: service.port,
					deviceKey: service.txt.device_key,
					lastSeen: Date.now(),
				})
			}
		})

		zeroconf.on('remove', (name) => {
			const device_key = nameToKeyRef.current.get(name)
			if (device_key) {
				useDiscoveryStore.getState().removeDevice(device_key)
				nameToKeyRef.current.delete(name)
			}
		})

		zeroconf.scan('hydro', 'tcp', 'local.')

		return () => {
			zeroconf.stop()
			zeroconf.removeAllListeners()
			zeroconfRef.current = null
		}
	}, [])

	// Periodic rescan keeps lastSeen fresh
	useEffect(() => {
		const interval = setInterval(() => {
			zeroconfRef.current?.scan('hydro', 'tcp', 'local.')
		}, RESCAN_INTERVAL_MS)
		return () => clearInterval(interval)
	}, [])

	// Prune devices that haven't been seen recently (fallback for silent drops)
	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now()
			const devices = useDiscoveryStore.getState().devices
			for (const [deviceKey, device] of devices.entries()) {
				if (device.lastSeen && now - device.lastSeen > STALE_MS) {
					useDiscoveryStore.getState().removeDevice(deviceKey)
					nameToKeyRef.current.forEach((key, name) => {
						if (key === deviceKey) {
							nameToKeyRef.current.delete(name)
						}
					})
				}
			}
		}, PRUNE_CHECK_INTERVAL_MS)
		return () => clearInterval(interval)
	}, [])

	const rescan = () => zeroconfRef.current?.scan('hydro', 'tcp', 'local.')

	return { rescan }
}
