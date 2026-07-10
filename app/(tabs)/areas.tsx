import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { Portal } from '@gorhom/portal'
import { useHeaderHeight } from '@react-navigation/elements'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useLocalSearchParams, useRouter } from 'expo-router'

import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
import BottomSheet from '@/components/layout/BottomSheet'
import Card from '@/components/layout/Card'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import Badge from '@/components/ui/Badge'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import Button from '@/components/ui/Button'
import CardItem from '@/components/ui/CardItem'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { areaLinkMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { AppError } from '@/types/api'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

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

	const now = new Date()

	// Helper functions
	const minutesAgo = (m: number) =>
		new Date(now.getTime() - m * 60000).toISOString()
	const minutesFromNow = (m: number) =>
		new Date(now.getTime() + m * 60000).toISOString()

	const mockMqttAreaData = [
		{
			key: 'zona-competa-pozo',
			stations: [
				{
					id: 1,
					type: 'solenoid',
					name: 'Riego Pozo Llano',
					status: 'active',
					reason: 'scheduled',
				},
				{
					id: 2,
					type: 'solenoid',
					name: 'Válvula Principal Oeste',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 3,
					type: 'solenoid',
					name: 'Válvula Principal Este',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 4,
					type: 'solenoid',
					name: 'Riego Bancada Hidropónica',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 6,
					type: 'pump',
					name: 'Bomba de Pozo',
					status: 'active',
					reason: 'none',
				},
				{
					id: 7,
					type: 'fertilizer',
					name: 'Fertilizante A',
					status: 'active',
					reason: 'none',
				},
			],
			schedules: [
				{
					id: 1,
					name: 'Riego de la Mañana',
					status: 'active',
					startTime: minutesAgo(15),
					endTime: minutesFromNow(75),
				},
			],
			scheduleState: {
				pastSchedule: {
					id: 99,
					name: 'Lavado Nocturno',
					status: 'completed',
					startTime: minutesAgo(300),
					endTime: minutesAgo(240),
				},
				currentSchedule: {
					id: 1,
					name: 'Riego de la Mañana',
					status: 'active',
					startTime: minutesAgo(15),
					endTime: minutesFromNow(75),
				},
			},
			lastSeen: now.toISOString(),
			location: '36.8366, -3.9740',
		},

		{
			key: 'zona-almeria-invernadero',
			stations: [
				{
					id: 1,
					type: 'solenoid',
					name: 'Riego Pozo Llano',
					status: 'active',
					reason: 'scheduled',
				},
				{
					id: 2,
					type: 'solenoid',
					name: 'Válvula Principal Oeste',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 3,
					type: 'solenoid',
					name: 'Válvula Principal Este',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 4,
					type: 'solenoid',
					name: 'Riego Bancada Hidropónica',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 6,
					type: 'pump',
					name: 'Bomba de Pozo',
					status: 'active',
					reason: 'none',
				},
				{
					id: 7,
					type: 'fertilizer',
					name: 'Fertilizante A',
					status: 'active',
					reason: 'none',
				},
			],
			schedules: [
				{
					id: 3,
					name: 'Ciclo de Alimentación Continua',
					status: 'inactive',
					startTime: minutesAgo(120),
					endTime: minutesAgo(60),
				},
			],
			scheduleState: {
				pastSchedule: null,
				currentSchedule: null,
			},
			lastSeen: now.toISOString(),
			location: '36.7750, -2.8100',
		},

		{
			key: 'zona-manchuela-pastizal',
			stations: [
				{
					id: 1,
					type: 'solenoid',
					name: 'Riego Pozo Llano',
					status: 'active',
					reason: 'scheduled',
				},
				{
					id: 2,
					type: 'solenoid',
					name: 'Válvula Principal Oeste',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 3,
					type: 'solenoid',
					name: 'Válvula Principal Este',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 4,
					type: 'solenoid',
					name: 'Riego Bancada Hidropónica',
					status: 'inactive',
					reason: 'none',
				},
				{
					id: 6,
					type: 'pump',
					name: 'Bomba de Pozo',
					status: 'active',
					reason: 'none',
				},
				{
					id: 7,
					type: 'fertilizer',
					name: 'Fertilizante A',
					status: 'active',
					reason: 'none',
				},
			],
			schedules: [],
			scheduleState: {
				pastSchedule: null,
				currentSchedule: null,
			},
			lastSeen: now.toISOString(),
			location: '39.2764, -3.0933',
		},
	]

	// Query for fetching user's areas
	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})

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
		onSuccess: () => {
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			queryClient.refetchQueries({ queryKey: ['areas'] })
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

	// --- Loading state ---
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

	// --- Error loading areas (connection/server issue) ---
	if (areaLoadError) {
		return (
			<StatusScreen
				image={
					<ServerFailureIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Areas Unavailable"
				subtitle="Your areas couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// --- Missing or unavailable area data ---
	if (!areas) {
		return (
			<StatusScreen
				image={
					<FilesMissingIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Area Data Unavailable"
				subtitle="Some area data couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	if (areas.length === 0) {
		return (
			<>
				<StatusScreen
					image={
						<FilesMissingIllustration
							width={200}
							height={220}
							color={theme.colors.accentBlue}
						/>
					}
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

	return (
		<KeyboardAwareScrollView
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
				flexGrow: 1,
			}}
		>
			<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			{areas.map((area, index) => {
				// MQTT data provides real-time data about areas like last seen,
				// stations data, location, etc.

				// Drop the .find() and the API key check entirely—just map them 1:1 by array index
				const mqttData = mockMqttAreaData[index]

				if (!mqttData) {
					return (
						<Card key={area.id} flexDirection="column" elevation={0}>
							<CardItem
								title={area.name ?? 'Unnamed Area'}
								subtitle="Offline • No data available"
								icon="map-marker-radius"
								statusColor={theme.colors.offline}
								statusBg={theme.colors.offlineBg}
							/>
						</Card>
					)
				}

				const isOnline =
					new Date().getTime() - new Date(mqttData.lastSeen).getTime() <
					5 * 60 * 1000

				const solenoids = mqttData.stations.filter(
					(station) => station.type === 'solenoid',
				)
				const currentlyActiveStation = solenoids.find(
					(station) => station.status === 'active',
				)
				const currentlyActiveSchedule = mqttData.schedules.find(
					(schedule) => schedule.status === 'active',
				)

				const subtitle = `${solenoids.length} ${
					solenoids.length === 1 ? 'station' : 'stations'
				}`

				const pumps = mqttData.stations.filter(
					(station) => station.type === 'pump',
				)
				console.log('pumps', pumps)
				const fertilizers = mqttData.stations.filter(
					(station) => station.type === 'fertilizer',
				)

				// The API provides more "static" data like name, description,
				// picture, firmware version, etc.

				return (
					<Card key={area.id} flexDirection="column" elevation={0}>
						<CardItem
							title={area.name ?? 'Unnamed Area'}
							subtitle={subtitle}
							icon={isOnline ? 'map-marker-check' : 'map-marker-off'}
							statusColor={
								isOnline ? theme.colors.online : theme.colors.offline
							}
							statusBg={
								isOnline ? theme.colors.onlineBg : theme.colors.offlineBg
							}
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
							bottomElement={
								<View>
									{currentlyActiveStation && (
										<>
											<View
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													gap: theme.space.md,
													borderRadius: theme.radius.boxInCard,
													backgroundColor: theme.colors.activeBg,
													padding: theme.space.lg,
												}}
											>
												<View style={{ flex: 1 }}>
													<View
														style={{
															flexDirection: 'row',
															alignItems: 'center',
														}}
													>
														<View
															style={{
																flexDirection: 'row',
																alignItems: 'center',
																gap: theme.space.sm,
															}}
														>
															<MaterialCommunityIcons
																name="valve-open"
																size={18}
																color={theme.colors.active}
															/>
															<Text
																numberOfLines={1}
																style={{
																	color: theme.colors.active,
																	fontSize: theme.font.base,
																	fontWeight: '500',
																}}
															>
																{currentlyActiveStation.name}
															</Text>
														</View>
													</View>
													<Text
														style={{
															color: theme.colors.textSecondary,
															fontSize: theme.font.sm,
															fontWeight: '400',
															marginTop: 2,
														}}
													>
														{currentlyActiveStation.reason === 'manual'
															? 'Manual Mode'
															: currentlyActiveSchedule
																? `${currentlyActiveSchedule.name}`
																: 'Scheduled'}
														{' • '}

														{currentlyActiveSchedule?.startTime &&
															formatRelativeTime(
																currentlyActiveSchedule.startTime,
															)}
													</Text>
												</View>
											</View>
										</>
									)}
									{(pumps.length > 0 || fertilizers.length > 0) && (
										<View
											style={{
												flexDirection: 'row',
												flexWrap: 'wrap',
												gap: theme.space.sm,
												marginTop: theme.space.md,
											}}
										>
											{pumps.map((pump) => (
												<Badge
													key={pump.id}
													icon="water-pump"
													text={pump.name}
													color={theme.colors.textSecondary}
													borderColor={theme.colors.accentBlueLight}
													backgroundColor={theme.colors.card}
												/>
											))}

											{fertilizers.map((fertilizer) => (
												<Badge
													key={fertilizer.id}
													icon="chemical-weapon"
													text={fertilizer.name}
													color={theme.colors.textSecondary}
													borderColor={theme.colors.accentBlueLight}
													backgroundColor={theme.colors.card}
												/>
											))}
										</View>
									)}
								</View>
							}
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
