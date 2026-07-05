import { useCallback, useEffect, useRef, useState } from 'react'
import {
	View,
	StyleSheet,
	Text,
	Animated,
	Pressable,
	ActivityIndicator,
	TouchableOpacity,
} from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import BottomSheet from '@/components/layout/BottomSheet'
import Button from '@/components/ui/Button'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import { useTheme } from '@/context/ThemeContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { areaLinkMutation, areaUnlinkMutation } from '@/mutations/areas'
import * as Burnt from 'burnt'
import { Portal } from '@gorhom/portal'
import { areasQuery } from '@/queries/areas'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useHeaderHeight } from '@react-navigation/elements'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { RefreshControl, ScrollView } from 'react-native-gesture-handler'
import StatusScreen from '@/components/status/StatusScreen'
import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function DevicesScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const headerHeight = useHeaderHeight()
	const router = useRouter()
	const bottomSheetRef = useRef<BottomSheetMethods>(null)

	const [linkCode, setLinkCode] = useState('')
	const { scanned } = useLocalSearchParams<{ scanned?: string }>()
	const [scannedCode, setScannedCode] = useState<string | null>(null)

	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery(areasQuery)

	const { mutate, isPending: linkPending } = useMutation({
		mutationFn: areaLinkMutation.mutationFn,
		onSuccess: () => {
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			// force refetch immediately
			queryClient.refetchQueries({ queryKey: ['areas'] })
			bottomSheetRef.current?.close()
			setLinkCode('')
			setScannedCode(null)
		},
		onError: (error) => {
			Burnt.toast({ title: error.message, preset: 'error' })
			setScannedCode(null)
		},
	})

	const handleLinkCodeSubmit = useCallback(() => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
			return
		}
		mutate(linkCode)
	}, [linkCode, mutate])

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

	useEffect(() => {
		if (scanned) {
			setScannedCode(scanned.trim())
		}
	}, [scanned])

	useEffect(() => {
		if (!scannedCode) return
		if (scannedCode.length === 32) {
			mutate(scannedCode)
		} else {
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
		}
		setScannedCode(null)
	}, [scannedCode, mutate])

	const { mutate: unlinkArea } = useMutation({
		mutationFn: areaUnlinkMutation.mutationFn,
		onSuccess: (_, areaId) => {
			Burnt.toast({ title: 'Area unlinked successfully', preset: 'done' })
			queryClient.resetQueries({ queryKey: ['areas'] })
			queryClient.refetchQueries({ queryKey: ['areas'], type: 'active' })
		},
		onError: (error) => {
			Burnt.toast({ title: error.message, preset: 'error' })
		},
	})

	const handleScanPress = () => {
		bottomSheetRef.current?.close()
		router.push('/(area)/scan')
	}

	const styles = StyleSheet.create({
		fab: { position: 'absolute', right: 20, bottom: 28 },
		iconBackdrop: {
			width: theme.space.x3l,
			height: theme.space.x3l,
			borderRadius: theme.radius.fab,
			backgroundColor: theme.colors.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
		},
	})

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
								marginBottom: theme.space.md,
								fontSize: theme.font.base,
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
							onPress={handleScanPress}
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
		<ScrollView
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight + theme.space.sm,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
				flexGrow: 1,
			}}
		>
			<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			{areas.map((area) => (
				<TouchableOpacity
					key={area.id}
					style={{
						padding: theme.space.lg,
						borderRadius: theme.radius.card,
						backgroundColor: theme.colors.card,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							gap: theme.space.md,
							alignItems: 'center',
						}}
					>
						<View style={styles.iconBackdrop}>
							<MaterialCommunityIcons
								name="home-city-outline"
								size={20}
								color={theme.colors.accentBlue}
							/>
						</View>
						<View style={{ flexShrink: 1, gap: theme.space.x3s, flex: 1 }}>
							<Text
								style={{
									color: theme.colors.textPrimary,
									fontSize: theme.font.md,
									fontWeight: '500',
									flexDirection: 'row',
								}}
							>
								{area.name ?? area.technicalName}
							</Text>

							<Text
								style={{
									color: theme.colors.textSecondary,
									marginTop: 4,
									fontSize: theme.font.sm,
								}}
							>
								{area.location} -{' '}
								{area.firmware
									? `Firmware ${area.firmware}`
									: 'Firmware unknown'}{' '}
								- {area.lastSeen ? `Last seen ${area.lastSeen}` : 'Never seen'}
							</Text>
						</View>
						<Pressable onPress={() => unlinkArea(area.id)}>
							<MaterialIcons
								name="link-off"
								size={24}
								color={theme.colors.textSecondary}
								style={{ opacity: 0.7 }}
							/>
						</Pressable>
					</View>
				</TouchableOpacity>
			))}

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
						size={28}
						color={theme.colors.buttonPrimaryText}
					/>
				}
				extraStyles={styles.fab}
				onPress={() => bottomSheetRef.current?.expand()}
			/>
		</ScrollView>
	)
}
