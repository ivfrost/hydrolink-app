import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { Portal } from '@gorhom/portal'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHeaderHeight } from 'expo-router/build/react-navigation'

import AreaCardItem from '@/components/areas/AreaCardItem'
import BottomSheet from '@/components/layout/BottomSheet'
import Card from '@/components/layout/Card'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import Button from '@/components/ui/Button'
import CardItem from '@/components/ui/CardItem'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { areaLinkMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { useAreaStore } from '@/stores/areaStore'
import { AppError } from '@/types/api'

export default function AreaTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheetMethods>(null)
	const insets = useSafeAreaInsets()
	const router = useRouter()
	const [linkCode, setLinkCode] = useState('')
	const [isRefreshing, setIsRefreshing] = useState(false)
	const headerHeight = useHeaderHeight()
	const { scanned } = useLocalSearchParams<{ scanned?: string }>()
	const reconnectMqtt = useMqtt().reconnect

	// Query for fetching user's areas
	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})
	const mqttAreas = useAreaStore((state) => state.areas)
	const isAreaOnline = useAreaStore((state) => state.isOnline)

	// Mutation for linking an area
	const { mutate, isPending: linkPending } = useMutation({
		mutationKey: ['linkArea'],
		mutationFn: areaLinkMutationFn,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred. Please try again later.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async () => {
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			queryClient.refetchQueries({ queryKey: ['areas'] })
			reconnectMqtt()
			bottomSheetRef.current?.close()
			setLinkCode('')
		},
	})

	// Handler for submitting the link code
	const handleLinkCodeSubmit = useCallback(() => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
			return
		}
		mutate(linkCode)
	}, [linkCode, mutate])

	// Handler to refresh areas data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: ['areas'] })
			reconnectMqtt()
		} catch (error) {
			console.error('Error refreshing areas:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	// Effect to handle received scanned code from QR scanner
	useEffect(() => {
		if (!scanned) return

		const cleanedCode = scanned.trim()

		if (cleanedCode.length === 32) {
			mutate(cleanedCode)
		} else {
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
		}

		// Clear the navigation parameter immediately so the same code
		// doesn't accidentally re-execute if the screen re-focuses
		router.setParams({ scanned: undefined })
	}, [scanned, mutate, router])

	// Handler to go to the QR code scanner screen
	const handleGoScan = async () => {
		bottomSheetRef.current?.close()
		router.push({ pathname: '/(area)/scan', params: { from: 'areas' } })
	}

	// Loading state while areas are being fetched
	if (areasPending) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading areas…
				</Text>
			</View>
		)
	}

	// Error state if areas failed to load
	if (areaLoadError) {
		return (
			<StatusScreen
				variant="network-error"
				title="Areas Unavailable"
				subtitle="Your areas couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// Error state if areas data is null or undefined
	if (!areas) {
		return (
			<StatusScreen
				variant="missing-data"
				title="Area Data Unavailable"
				subtitle="Some area data couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// No linked areas state
	if (areas.length === 0) {
		return (
			<>
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
							You can link a device by scanning a QR code or entering a{' '}
							<Text
								style={{
									fontVariant: ['small-caps'],
									color: theme.colors.textPrimary,
									fontWeight: '500',
								}}
							>
								Link Code
							</Text>
						</Text>
					}
					buttonLabel="Link a Device"
					buttonIcon={
						<MaterialCommunityIcons
							name="link-plus"
							size={24}
							color={theme.colors.buttonPrimaryText}
						/>
					}
					onButtonPress={() => bottomSheetRef.current?.expand()}
					onRefresh={onRefresh}
					isRefreshing={isRefreshing}
				/>
				<Portal>
					<BottomSheet ref={bottomSheetRef} snapPoints={[364]}>
						<Button
							label="Scan QR Code"
							modifier={['tall', 'full']}
							icon={
								<MaterialIcons
									name="qr-code-scanner"
									size={24}
									color={theme.colors.buttonPrimaryText}
								/>
							}
							onPress={handleGoScan}
						/>
						<View
							style={{
								flexDirection: 'row',
								width: '100%',
								alignItems: 'center',
								gap: 20,
								marginVertical: 10,
							}}
						>
							<View
								style={{
									backgroundColor: theme.colors.border,
									height: 2,
									flex: 1,
								}}
							/>
							<Text style={{ color: theme.colors.textSecondary }}>
								or enter manually
							</Text>
							<View
								style={{
									backgroundColor: theme.colors.border,
									height: 2,
									flex: 1,
								}}
							/>
						</View>
						<View style={{ gap: theme.space.md, marginTop: theme.space.x2l }}>
							<BottomSheetInput
								label="Enter Link Code"
								value={linkCode}
								onChangeText={setLinkCode}
								onSubmitEditing={handleLinkCodeSubmit}
								labelBackground={theme.colors.card}
							/>
							<Button
								label="Submit"
								variant="secondary"
								modifier={['tall', 'full']}
								disabled={linkCode.length !== 32 || linkPending}
								onPress={handleLinkCodeSubmit}
								iconPosition="right"
								icon={
									<MaterialIcons
										name="arrow-forward"
										size={24}
										color={
											linkCode.length !== 32 || linkPending
												? theme.colors.textMuted
												: theme.colors.buttonSecondaryText
										}
									/>
								}
							/>
						</View>
					</BottomSheet>
				</Portal>
			</>
		)
	}

	// Main content rendering when areas already linked and available
	return (
		<KeyboardAwareScrollView
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					progressViewOffset={headerHeight}
				/>
			}
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
				flexGrow: 1,
			}}
		>
			{areas.map((area, idx) => {
				// Retrieve the corresponding MQTT data for the area using its key
				const areaData = mqttAreas[area.key]
				console.log(areaData, 'areaData')
				let subtitle
				console.log(
					'isAreaOnline(area.key)',
					isAreaOnline(area.key),
					'area.key',
					area.key,
				)
				const online = isAreaOnline(area.key)
				// Fallback screen for missing MQTT data
				if (!areaData || !online) {
					console.warn(
						`Area ${area.key} has no MQTT data or is offline. Falling back to API data for display.`,
					)
					subtitle = `${area.locationLabel ?? 'Unknown Location'} • Real-time data unavailable`
					return (
						<Card key={area.id + idx} flexDirection="column" elevation={0}>
							<CardItem
								title={area.friendlyName ?? area.key ?? 'Unnamed Area'}
								subtitle={subtitle}
								icon="map-marker-off"
								statusColor={
									!online ? theme.colors.offline : theme.colors.online
								}
								statusBg={
									!online ? theme.colors.offlineBg : theme.colors.onlineBg
								}
								onPress={() => router.push(`/areas/${area.key}`)}
								rightElement={
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 4,
											flex: 1,
										}}
									>
										<TouchableOpacity>
											<MaterialIcons
												name="chevron-right"
												size={24}
												color={theme.colors.textMuted}
											/>
										</TouchableOpacity>
									</View>
								}
							/>
						</Card>
					)
				}
				const lastUpdatedStr = areaData?.lastUpdated

				const isOnline = isAreaOnline(area.key)
				const allStations = Object.values(areaData.stations || {})
				const solenoids = allStations.filter((s) => s.type === 'Solenoid')
				const pumps = allStations.filter((s) => s.type === 'Pump')
				const fertilizers = allStations.filter((s) => s.type === 'Fertilizer')
				const sensors = allStations.filter((s) => s.type === 'Sensor')
				const unclassified = allStations.filter((s) => s.type === 'Unknown')

				const activeSolenoid = solenoids.find(
					(station) => station.status.state === 'Running',
				)
				const activePumps = pumps.filter(
					(station) => station.status.state === 'Running',
				)
				const activeFertilizers = fertilizers.filter(
					(station) => station.status.state === 'Running',
				)
				const stationCount =
					solenoids.length + pumps.length + fertilizers.length
				const unclassifiedCount = unclassified.length

				const allSchedules = allStations.flatMap(
					(station) => station.schedules || [],
				)
				const mockSchedules = [
					{
						start: '2024-06-01T08:00:00Z',
						end: '2024-06-01T09:00:00Z',
						active: true,
						ok: true,
					},
					{
						start: '2024-06-02T10:00:00Z',
						end: '2024-06-02T11:00:00Z',
						active: false,
						ok: true,
					},
					{
						start: '2024-06-03T12:00:00Z',
						end: '2024-06-03T13:00:00Z',
						active: false,
						ok: false,
					},
				]

				const location = area.locationLabel || 'Unknown Location'

				subtitle = `${location} • ${stationCount} station${stationCount !== 1 ? 's' : ''} • ${unclassifiedCount} unclassified`
				console.log('subtitle', subtitle, 'lastUpdatedStr', lastUpdatedStr)

				console.log('currentlyActiveSolenoid', activeSolenoid)

				return (
					<Card key={area.id + idx} flexDirection="column" elevation={0}>
						<AreaCardItem
							title={area.friendlyName ?? area.key ?? 'Unnamed Area'}
							subtitle={subtitle}
							online={isOnline}
							activeSolenoid={activeSolenoid}
							activePumps={activePumps}
							activeFertilizers={activeFertilizers}
							sensors={sensors}
							schedules={mockSchedules}
							onPress={() => router.push(`/areas/${area.key}`)}
						/>
					</Card>
				)
			})}

			<Portal>
				<BottomSheet ref={bottomSheetRef} snapPoints={[364]}>
					<Button
						label="Scan QR Code"
						modifier={['tall', 'full']}
						icon={
							<MaterialIcons
								name="qr-code-scanner"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
						onPress={() => router.push('/(area)/scan')}
					/>
					<View
						style={{
							flexDirection: 'row',
							width: '100%',
							alignItems: 'center',
							gap: 20,
							marginVertical: 10,
						}}
					>
						<View
							style={{
								backgroundColor: theme.colors.border,
								height: 2,
								flex: 1,
							}}
						/>
						<Text style={{ color: theme.colors.textSecondary }}>
							or enter manually
						</Text>
						<View
							style={{
								backgroundColor: theme.colors.border,
								height: 2,
								flex: 1,
							}}
						/>
					</View>
					<View style={{ gap: theme.space.md, marginTop: theme.space.x2l }}>
						<BottomSheetInput
							label="Enter Link Code"
							value={linkCode}
							onChangeText={setLinkCode}
							onSubmitEditing={handleLinkCodeSubmit}
							labelBackground={theme.colors.card}
						/>
						<Button
							label="Submit"
							variant="secondary"
							modifier={['tall', 'full']}
							disabled={linkCode.length !== 32 || linkPending}
							onPress={handleLinkCodeSubmit}
							iconPosition="right"
							icon={
								<MaterialIcons
									name="arrow-forward"
									size={24}
									color={
										linkCode.length !== 32 || linkPending
											? theme.colors.textMuted
											: theme.colors.buttonSecondaryText
									}
								/>
							}
						/>
					</View>
				</BottomSheet>
			</Portal>
			<Button
				label={''}
				modifier={['fab']}
				icon={
					<MaterialIcons
						name="add"
						size={26}
						color={theme.colors.buttonPrimaryText}
					/>
				}
				extraStyles={{
					position: 'absolute',
					right: 20,
					bottom: 28,
				}}
				onPress={() => bottomSheetRef.current?.expand()}
			/>
		</KeyboardAwareScrollView>
	)
}
