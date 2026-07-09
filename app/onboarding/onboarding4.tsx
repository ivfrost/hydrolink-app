import { useEffect, useRef, useState } from 'react'
import { Text, View, ActivityIndicator } from 'react-native'

import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import BottomSheet from '@gorhom/bottom-sheet'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useLocalSearchParams, useRouter } from 'expo-router'

import CurrentLocationIllustration from '@/assets/images/onboarding/undraw_current-location_c8qn.svg'
import HydroBSheet from '@/components/layout/BottomSheet'
import ButtonColumnWrapper from '@/components/layout/ButtonColumnWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import Button from '@/components/ui/Button'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { areaLinkMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { useOnboarding } from '@/stores/onboardingStore'
import { AppError } from '@/types/api'

export default function OnboardingStep4() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheet>(null)
	const router = useRouter()
	const [linkCode, setLinkCode] = useState('')
	const { scanned } = useLocalSearchParams<{ scanned?: string }>()
	const setHasOnboarded = useOnboarding().setHasOnboarded

	// Mutation for linking an area
	const { mutate, isPending: linkPending } = useMutation({
		mutationKey: tanstackKeys.AREA_LINK,
		mutationFn: areaLinkMutationFn,
		onSuccess: () => {
			setHasOnboarded(true)
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			queryClient.refetchQueries({ queryKey: ['areas'] })
			router.replace('/(tabs)')
		},
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred. Please try again later.'
						: error.message,
				preset: 'error',
			})
		},
	})

	// Query for fetching user's areas
	const { data: areas, isPending: fetchAreasPending } = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})

	// Skip onboarding if the user already has linked areas
	useEffect(() => {
		if (fetchAreasPending) {
			return
		}
		if (areas && areas.length > 0) {
			router.replace('/(tabs)')
		}
	}, [router, areas, fetchAreasPending])

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
		router.push({ pathname: '/(area)/scan', params: { from: 'onboarding' } })
	}

	// Handler for submitting the link code
	const handleLinkCodeSubmit = () => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be of 32 characters of length' })
			return
		}
		bottomSheetRef.current?.close()
		mutate(linkCode)
		console.log('Link code submitted:', linkCode)
	}

	return (
		<OnboardContainer>
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.xl,
				}}
			>
				<CurrentLocationIllustration
					width={300}
					height={300}
					color={theme.colors.accentBlue}
				/>
				<OnboardTextWrapper>
					<Title text="Add your first area" />
					<Subtitle>
						Each device controls one area of your irrigation system. Scan the QR
						code or enter your{' '}
						<Text
							style={{
								fontVariant: ['small-caps'],
								color: theme.colors.textPrimary,
								fontWeight: '500',
							}}
						>
							Link Code
						</Text>{' '}
						to connect your device.
					</Subtitle>
				</OnboardTextWrapper>
			</View>
			<ButtonColumnWrapper>
				<Button
					label="Add Area"
					onPress={() => bottomSheetRef.current?.expand()}
					iconPosition="right"
					disabled={fetchAreasPending}
					icon={
						linkPending ? (
							<ActivityIndicator
								size="small"
								color={
									fetchAreasPending
										? theme.colors.buttonDisabledText
										: theme.colors.buttonPrimaryText
								}
							/>
						) : (
							<MaterialIcons
								name="add"
								size={24}
								color={
									fetchAreasPending
										? theme.colors.buttonDisabledText
										: theme.colors.buttonPrimaryText
								}
							/>
						)
					}
				/>
				<Button
					label="Skip for now"
					onPress={() => router.replace('/(tabs)')}
					variant="secondary"
				/>
			</ButtonColumnWrapper>
			<HydroBSheet ref={bottomSheetRef} snapPoints={[364]}>
				<Button
					label="Scan QR Code"
					modifier={['tall', 'full']}
					disabled={fetchAreasPending}
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
							width: 'auto',
							backgroundColor: theme.colors.border,
							height: 2,
							flex: 1,
						}}
					/>
				</View>
				<View style={{ gap: 20 }}>
					<View>
						<BottomSheetInput
							label="Enter Link Code"
							value={linkCode}
							onChangeText={setLinkCode}
							onSubmitEditing={handleLinkCodeSubmit}
							labelBackground={theme.colors.card}
						/>
					</View>
					<Button
						label={'Submit'}
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
										? theme.colors.buttonDisabledText
										: theme.colors.buttonSecondaryText
								}
							/>
						}
					/>
				</View>
			</HydroBSheet>
		</OnboardContainer>
	)
}
