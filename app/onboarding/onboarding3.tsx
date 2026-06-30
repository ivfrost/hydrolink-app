import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { Text, View, ActivityIndicator } from 'react-native'
import CurrentLocationIllustration from '@/assets/images/onboarding/undraw_current-location_c8qn.svg'
import BottomSheet from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import HydroBSheet from '@/components/layout/BottomSheet'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { useMutation, useQuery } from '@tanstack/react-query'
import { areaLinkMutation } from '@/mutations/areas'
import { areasQuery } from '@/queries/areas'
import { useOnboarding } from '@/stores/onboardingStore'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Title from '@/components/ui/Title'
import Subtitle from '@/components/ui/Subtitle'
import ButtonColumnWrapper from '@/components/layout/ButtonColumnWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'

export default function Onboarding3() {
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheet>(null)
	const router = useRouter()
	const [linkCode, setLinkCode] = useState('')
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const { mutate, isPending: linkPending } = useMutation({
		...areaLinkMutation,
		onSuccess: () => {
			setHasOnboarded(true)
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			router.replace('/(tabs)')
		},
		onError: (error) => {
			Burnt.toast({
				title:
					error.message === 'NETWORK_ERROR'
						? 'Could not connect to server'
						: 'Invalid link code',
				preset: 'error',
			})
		},
	})
	const { data: areas, isPending: fetchAreasPending } = useQuery(areasQuery)

	useEffect(() => {
		console.log('areas:', areas)
		console.log('fetchAreasPending:', fetchAreasPending)
		if (fetchAreasPending) {
			return
		}
		if (areas && areas.details.length > 0) {
			Burnt.toast({ title: 'You already have areas linked', preset: 'done' })
			router.replace('/(tabs)')
		}
	}, [router, areas, fetchAreasPending])

	const handleLinkCodeSubmit = () => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be of 32 characters of length' })
			return
		}
		bottomSheetRef.current?.close()
		mutate(linkCode)
		// Handle link code submission
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
								color={theme.colors.textPrimary}
							/>
						) : (
							<MaterialIcons
								name="add"
								size={24}
								color={theme.colors.textPrimary}
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
							color={theme.colors.textPrimary}
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
								color={theme.colors.buttonSecondaryText}
							/>
						}
					/>
				</View>
			</HydroBSheet>
		</OnboardContainer>
	)
}
