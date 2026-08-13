import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Burnt from 'burnt'
import { useLocalSearchParams } from 'expo-router'

import ScrollView from '@/components/layout/ScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Picker } from '@/components/ui/Picker'
import { useTheme } from '@/context/ThemeContext'

// The ESP exposes its configuration API on the AP (captive portal) address.
const ESP_BASE_URL = 'http://192.168.4.1'

interface EspNetwork {
	ssid: string
	rssi: number
	frequency: string
	secure: string
}

interface EspNetworkStatus {
	ssid: string
	connected: boolean
}

async function fetchEspJson<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${ESP_BASE_URL}${path}`, init)
	if (!res.ok) throw new Error(`ESP responded with HTTP ${res.status}`)
	console.log('ESP response', await res.text())
	return (await res.json()) as T
}

export default function Connectivity() {
	const theme = useTheme()
	const { key } = useLocalSearchParams() as { key: string }

	const [reachable, setReachable] = useState<boolean | null>(null)
	const [currentNetwork, setCurrentNetwork] = useState<EspNetworkStatus | null>(
		null,
	)
	const [networks, setNetworks] = useState<EspNetwork[]>([])
	const [scanning, setScanning] = useState(false)
	const [selectedSsid, setSelectedSsid] = useState('')
	const [password, setPassword] = useState('')
	const [saving, setSaving] = useState(false)

	const refreshStatus = useCallback(async () => {
		try {
			const status = await fetchEspJson<EspNetworkStatus>('/api/network')
			setCurrentNetwork(status)
			setReachable(true)
		} catch {
			setReachable(false)
		}
	}, [])

	useEffect(() => {
		refreshStatus()
	}, [refreshStatus])

	const handleScan = useCallback(async () => {
		setScanning(true)
		try {
			// GET /api/networks returns 202 {"status": "..."} while the scan is
			// running and a bare JSON array of networks once it finishes, so poll
			// a few times before giving up.
			let list: EspNetwork[] = []
			for (let attempt = 0; attempt < 4; attempt++) {
				const res = await fetch(`${ESP_BASE_URL}/api/networks`)
				if (!res.ok) throw new Error(`ESP responded with HTTP ${res.status}`)
				const payload: unknown = await res.json()
				if (Array.isArray(payload)) {
					list = payload as EspNetwork[]
					break
				}
				await new Promise((resolve) => setTimeout(resolve, 4000))
			}
			setNetworks(list)
			setSelectedSsid('')
			if (list.length === 0) {
				Burnt.toast({ title: 'No networks found', preset: 'done' })
			}
		} catch {
			Burnt.toast({
				title: 'Could not reach the device. Connect to its network first.',
				preset: 'error',
			})
		} finally {
			setScanning(false)
		}
	}, [])

	const handleConnect = useCallback(async () => {
		if (!selectedSsid) {
			Burnt.toast({ title: 'Select a network first', preset: 'error' })
			return
		}
		setSaving(true)
		try {
			await fetchEspJson('/api/network', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ssid: selectedSsid, password }),
			})
			Burnt.toast({ title: `Connecting to ${selectedSsid}...`, preset: 'done' })
			// Give the ESP a moment to apply and reconnect, then refresh.
			setTimeout(refreshStatus, 5000)
		} catch {
			Burnt.toast({ title: 'Failed to save the network', preset: 'error' })
		} finally {
			setSaving(false)
		}
	}, [selectedSsid, password, refreshStatus])

	const pickerOptions = networks.map((n) => ({
		label: `${n.ssid}  ${n.secure === 'secure' ? '🔒' : '🌐'}  ${n.rssi} dBm`,
		value: n.ssid,
	}))

	const statusColor = reachable
		? theme.colors.online
		: reachable === null
			? theme.colors.textMuted
			: theme.colors.fault

	return (
		<ScrollView>
			<View style={styles.content}>
				<View
					style={{
						alignItems: 'flex-start',
						gap: theme.space.sm,
						marginTop: theme.space.sm,
						paddingEnd: theme.space.md,
						paddingStart: theme.space.md,
						paddingVertical: theme.space.sm,
						borderRadius: theme.radius.boxInCard,
						backgroundColor: theme.colors.card,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.space.sm,
						}}
					>
						<MaterialCommunityIcons name="wifi" size={20} color={statusColor} />
						<Text
							style={{
								fontSize: theme.font.base,
								fontWeight: '600',
								color: theme.colors.textPrimary,
							}}
						>
							{reachable === null
								? 'Checking device…'
								: reachable
									? 'Device reachable'
									: 'Device not reachable'}
						</Text>
					</View>

					{reachable && (
						<Text
							style={{
								marginTop: theme.space.sm,
								fontSize: theme.font.sm,
								color: theme.colors.textSecondary,
							}}
						>
							{currentNetwork?.ssid
								? `Currently connected to ${currentNetwork.ssid}${
										currentNetwork.connected ? '' : ' (not connected)'
									}`
								: 'No network configured'}
						</Text>
					)}
					{!reachable && (
						<Text
							style={{
								marginTop: theme.space.sm,
								fontSize: theme.font.sm,
								color: theme.colors.textSecondary,
							}}
						>
							Connect to the <Text style={{ fontWeight: '600' }}>{key}</Text>{' '}
							network first, then refresh the status.
						</Text>
					)}

					<Button
						label="Refresh status"
						variant="secondary"
						modifier={['full']}
						icon="refresh"
						onPress={refreshStatus}
						extraStyles={{ marginTop: theme.space.md }}
					/>
				</View>

				<Button
					label={scanning ? 'Scanning…' : 'Scan for networks'}
					modifier={['full', 'tall']}
					icon="wifi"
					loading={scanning}
					disabled={scanning || !reachable}
					onPress={handleScan}
				/>

				{networks.length > 0 && (
					<Picker
						label="Network"
						options={pickerOptions}
						selectedValue={selectedSsid}
						onValueChange={setSelectedSsid}
						modifier={['outlined', 'full']}
					/>
				)}

				{selectedSsid ? (
					<Input
						label="Password"
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoCapitalize="none"
						autoCorrect={false}
						labelBackground={theme.colors.background}
						placeholder="Leave empty for open networks"
						placeholderTextColor={theme.colors.textMuted}
					/>
				) : null}

				<Button
					label="Connect device to this network"
					modifier={['full', 'tall']}
					icon="check"
					loading={saving}
					disabled={saving || !selectedSsid || !reachable}
					onPress={handleConnect}
				/>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	content: {
		gap: 12,
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 4,
	},
	fileSelector: {
		gap: 8,
	},
	fileMeta: {
		fontSize: 12,
		textAlign: 'center',
	},
	forceHint: {
		fontSize: 12,
		lineHeight: 18,
	},
})
