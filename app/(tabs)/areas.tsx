import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
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
import DashboardRowItem from '@/components/dashboard/DashboardRowItem'
import BottomSheet from '@/components/layout/BottomSheet'
import CardWrapper from '@/components/layout/CardWrapper'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import Button from '@/components/ui/Button'
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
	const handleGoScan = () => {
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
			{areas.map((area) => {
				const recentlySeen =
					// 5 minutes
					new Date(area.lastSeen).getTime() > Date.now() - 1000 * 60 * 5

				return (
					<CardWrapper key={area.id} flexDirection="column" elevation={0}>
						<DashboardRowItem
							key={area.id}
							title={area.name ?? 'Unnamed Area'}
							subtitle={area.location ?? 'Unknown Location'}
							icon="map-marker-radius"
							statusColor={
								recentlySeen ? theme.colors.online : theme.colors.offline
							}
							statusBg={
								recentlySeen ? theme.colors.onlineBg : theme.colors.offlineBg
							}
							onPress={() =>
								router.push({
									pathname: '/areas/[key]',
									params: {
										id: area.id,
										key: area.key,
										name: area.name,
										location: area.location,
										description: area.description,
										firmware: area.firmware,
										technicalName: area.technicalName,
										ip: area.ip,
										imageUrl: area.imageUrl,
										createdAt: area.createdAt,
										updatedAt: area.updatedAt,
										linkedAt: area.linkedAt,
										lastSeen: area.lastSeen,
										userId: area.userId,
										displayOrder: area.displayOrder,
									},
								})
							}
							renderRightElement={() => (
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.x3s,
									}}
								>
									<MaterialIcons
										name={
											recentlySeen ? 'wifi-tethering' : 'wifi-tethering-off'
										}
										size={12}
										color={
											recentlySeen
												? theme.colors.online
												: theme.colors.textSecondary
										}
									/>
									<Text
										style={{
											color: theme.colors.textSecondary,
											fontSize: theme.font.xs,
										}}
									>
										{formatRelativeTime(area.lastSeen)}
									</Text>
								</View>
							)}
						/>
					</CardWrapper>
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
