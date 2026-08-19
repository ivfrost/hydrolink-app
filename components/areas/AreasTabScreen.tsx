import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { Animated, Text } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'

import AreaCardItem, { UpdatingLabel } from '@/components/areas/AreaCardItem'
import Card from '@/components/layout/Card'
import ScrollView from '@/components/layout/ScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import Button from '@/components/ui/Button'
import CardItem from '@/components/ui/CardItem'
import { useTheme } from '@/context/ThemeContext'
import { isSensorStationType } from '@/data/area'
import { useDiscoveryStore } from '@/stores/discoveryStore'
import type { AreaDbData, AreaMqttData } from '@/types/area'

import OfflineBanner from '../ui/OfflineBanner'
import AreaBottomSheet from './AreaBottomSheet'

export interface AreasTabScreenProps {
	areas: AreaDbData[]
	mqttAreas: Record<string, AreaMqttData>
	isAreaOnline: (key: string) => boolean
	isRefreshing: boolean
	onRefresh: () => void
	linkCode: string
	setLinkCode: (value: string) => void
	onLinkCodeSubmit: () => void
	onScanPress: () => void
	onAddPress: () => void
	onAreaPress: (areaKey: string) => void
	linkPending: boolean
	bottomSheetRef: RefObject<BottomSheetMethods | null>
	headerHeight: number
	isOffline: boolean
	hasServerError: boolean
	canUseRemoteLinking: boolean
	canUseLocalDiscovery: boolean
	onDiscoverPress?: () => void
}

// Area card that "breathes" (pulses) and gets a dashed accent border while the
// device is undergoing an OTA firmware update.
function UpdatingAwareCard({
	updating,
	children,
}: {
	updating: boolean
	children: ReactNode
}) {
	const theme = useTheme()
	const [pulse] = useState(() => new Animated.Value(1))

	useEffect(() => {
		if (!updating) return
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(pulse, {
					toValue: 0.55,
					duration: 1200,
					useNativeDriver: true,
				}),
				Animated.timing(pulse, {
					toValue: 1,
					duration: 1200,
					useNativeDriver: true,
				}),
			]),
		)
		loop.start()
		return () => loop.stop()
	}, [updating, pulse])

	return (
		<Card
			flexDirection="column"
			elevation={0}
			extraStyles={
				updating
					? {
							borderWidth: 1,
							borderStyle: 'solid',
							borderColor: theme.colors.online,
						}
					: undefined
			}
		>
			<Animated.View style={{ opacity: updating ? pulse : 1 }}>
				{children}
			</Animated.View>
		</Card>
	)
}

export default function AreasTabScreen({
	areas = [],
	mqttAreas,
	isAreaOnline,
	isRefreshing,
	onRefresh,
	linkCode,
	setLinkCode,
	onLinkCodeSubmit,
	onScanPress,
	onAddPress,
	onAreaPress,
	linkPending,
	bottomSheetRef,
	headerHeight,
	isOffline,
	hasServerError,
	canUseRemoteLinking,
}: AreasTabScreenProps) {
	const theme = useTheme()
	const serverUnavailable = isOffline || hasServerError
	const canOpenLinkSheet = canUseRemoteLinking && !serverUnavailable
	const discoveredDevices = useDiscoveryStore((s) => s.devices)
	const linkedKeys = new Set(areas.map((a) => a.key))
	const unlinkedLocalDevices = Array.from(discoveredDevices.values()).filter(
		(d) => !linkedKeys.has(d.deviceKey),
	)

	if (areas.length === 0) {
		return (
			<>
				{serverUnavailable && (
					<OfflineBanner
						message={
							isOffline ? 'No internet connection' : "Can't reach the server"
						}
					/>
				)}
				{unlinkedLocalDevices.length > 0 ? (
					<ScrollView
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={onRefresh}
								progressViewOffset={headerHeight}
							/>
						}
					>
						{unlinkedLocalDevices.map((device) => (
							<Card
								key={device.deviceKey}
								flexDirection="column"
								elevation={0}
								extraStyles={{
									borderWidth: 1,
									borderStyle: 'dashed',
									borderColor: theme.colors.running,
								}}
							>
								<CardItem
									title={device.deviceKey}
									subtitle={
										<Text
											style={{
												fontSize: theme.font.sm,
												color: theme.colors.running,
												fontWeight: '600',
											}}
										>
											Found on network • Tap to link
										</Text>
									}
									icon="access-point"
									statusColor={theme.colors.running}
									statusBg={theme.colors.runningBg}
									onPress={() => bottomSheetRef.current?.expand()}
									rightElement={
										<MaterialCommunityIcons
											name="plus"
											size={theme.space.iconSize}
											color={theme.colors.running}
										/>
									}
								/>
							</Card>
						))}
					</ScrollView>
				) : (
					<StatusScreen
						variant="missing-data"
						title="No Areas Linked"
						customContent={
							<Text
								style={{
									color: theme.colors.textSecondary,
									textAlign: 'center',
									fontSize: theme.font.base,
									lineHeight: theme.lineHeight.paragraph,
								}}
							>
								You can link a device by scanning a QR code or entering a Link
								Code
							</Text>
						}
						buttonLabel="Link Area"
						buttonIcon={
							<MaterialCommunityIcons
								name="link-plus"
								size={theme.space.iconSize}
								color={theme.colors.buttonPrimaryText}
							/>
						}
						onButtonPress={canOpenLinkSheet ? onAddPress : undefined}
						onRefresh={onRefresh}
						isRefreshing={isRefreshing}
					/>
				)}
				<AreaBottomSheet
					bottomSheetRef={bottomSheetRef}
					onScanPress={onScanPress}
					setLinkCode={setLinkCode}
					onLinkCodeSubmit={onLinkCodeSubmit}
					linkPending={linkPending}
					serverUnavailable={serverUnavailable}
					theme={theme}
					linkCode={linkCode}
				/>
			</>
		)
	}

	return (
		<ScrollView
			fab={
				<Button
					modifier={['fab']}
					icon="add"
					extraStyles={{
						position: 'absolute',
						right: 0,
						bottom: 0,
					}}
					disabled={!canOpenLinkSheet || serverUnavailable}
					onPress={canOpenLinkSheet ? onAddPress : undefined}
				/>
			}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					progressViewOffset={headerHeight}
				/>
			}
		>
			{serverUnavailable && (
				<OfflineBanner
					message={
						isOffline ? 'No internet connection' : "Can't reach the server"
					}
				/>
			)}
			{areas.map((area, idx) => {
				const areaData = mqttAreas[area.key]
				let subtitle: ReactNode
				const online = isAreaOnline(area.key)

				if (!areaData || !online) {
					const isLocal = discoveredDevices.has(area.key)
					const isUpdating = mqttAreas[area.key]?.updating ?? false

					subtitle = isUpdating
						? 'Updating firmware…'
						: `${isLocal ? 'Local' : area.locationLabel?.trim() || 'Unknown Location'} • Offline`
					return (
						<Card key={area.id + idx} flexDirection="column" elevation={0}>
							<CardItem
								title={area.friendlyName || area.key || 'Unnamed Area'}
								subtitle={
									isUpdating ? (
										<UpdatingLabel />
									) : (
										<Text
											style={{
												fontSize: theme.font.sm,
												color: theme.colors.textSecondary,
											}}
										>
											{subtitle}
										</Text>
									)
								}
								icon={isUpdating ? 'update' : 'map-marker-off'}
								statusColor={
									isUpdating
										? theme.colors.online
										: !online
											? theme.colors.offline
											: theme.colors.online
								}
								statusBg={
									isUpdating
										? theme.colors.onlineBg
										: !online
											? theme.colors.offlineBg
											: theme.colors.onlineBg
								}
								onPress={() => onAreaPress(area.key)}
								rightElement={
									<MaterialIcons
										name="chevron-right"
										size={theme.space.iconSize}
										color={theme.colors.textMuted}
									/>
								}
							/>
						</Card>
					)
				}

				const isOnline = isAreaOnline(area.key)
				const isUpdating = mqttAreas[area.key]?.updating ?? false
				const allStations = Object.values(areaData.stations || {})
				const solenoids = allStations.filter((s) => s.type === 'Solenoid')
				const fertilizers = allStations.filter(
					(s) => s.type === 'FertilizerPump',
				)
				const sensors = allStations.filter((s) => isSensorStationType(s.type))

				const activeSolenoid = solenoids.find(
					(station) => station.status.state === 'Running',
				)
				const activeFertilizers = fertilizers.filter(
					(station) => station.status.state === 'Running',
				)
				const isLocal = discoveredDevices.has(area.key)
				const location = area.locationLabel

				// Local devices always get a blue "Local" hint so it's clear
				// they're reachable over the local network, even when the
				// area has a location label set.
				subtitle = (
					<Text
						style={{
							fontSize: theme.font.sm,
							color: theme.colors.textSecondary,
						}}
					>
						{isLocal ? (
							<Text
								style={{
									fontSize: theme.font.sm,
									color: theme.colors.running,
									fontWeight: '600',
								}}
							>
								Local
							</Text>
						) : (
							location || 'Unknown Location'
						)}
						{(allStations.length > 0 &&
							' • ' +
								allStations.length +
								' Station' +
								(allStations.length > 1 ? 's' : '')) ||
							'No Stations'}
					</Text>
				)

				return (
					<UpdatingAwareCard key={area.id + idx} updating={isUpdating}>
						<AreaCardItem
							title={area.friendlyName || area.key || 'Unnamed Area'}
							subtitle={subtitle}
							online={isOnline}
							updating={isUpdating}
							activeSolenoid={activeSolenoid}
							activeFertilizers={activeFertilizers}
							sensors={sensors}
							onPress={() => onAreaPress(area.key)}
						/>
					</UpdatingAwareCard>
				)
			})}
			{unlinkedLocalDevices.map((device) => (
				<Card
					key={device.deviceKey}
					flexDirection="column"
					elevation={0}
					extraStyles={{
						borderWidth: 1,
						borderStyle: 'dashed',
						borderColor: theme.colors.running,
					}}
				>
					<CardItem
						title={device.deviceKey}
						subtitle={
							<Text
								style={{
									fontSize: theme.font.sm,
									color: theme.colors.running,
									fontWeight: '600',
								}}
							>
								Found on network • Tap to link
							</Text>
						}
						icon="link-plus"
						statusColor={theme.colors.running}
						statusBg={theme.colors.runningBg}
						onPress={() => bottomSheetRef.current?.expand()}
						rightElement={
							<MaterialIcons
								name="chevron-right"
								size={theme.space.iconSize}
								color={theme.colors.running}
							/>
						}
					/>
				</Card>
			))}

			<AreaBottomSheet
				bottomSheetRef={bottomSheetRef}
				onScanPress={onScanPress}
				setLinkCode={setLinkCode}
				onLinkCodeSubmit={onLinkCodeSubmit}
				linkPending={linkPending}
				serverUnavailable={serverUnavailable}
				theme={theme}
				linkCode={linkCode}
			/>
		</ScrollView>
	)
}
