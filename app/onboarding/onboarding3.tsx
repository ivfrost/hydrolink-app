import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/theme'
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import CurrentLocationIllustration from '@/assets/images/onboarding/undraw_current-location_c8qn.svg'
import BottomSheet from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import HydroBottomSheet from '@/components/HydroBottomSheet'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import HydroBottomSheetInput from '@/components/HydroBottomSheetInput'
import HydroSubmitButton from '@/components/HydroSubmitButton'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { useMutation, useQuery } from '@tanstack/react-query'
import { areaLinkMutation } from '@/mutations/areas'
import { areasQuery } from '@/queries/areas'

export default function Onboarding1() {
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheet>(null)
	const router = useRouter()
	const [linkCode, setLinkCode] = useState('')
	const { mutate, isPending: linkPending } = useMutation({
		...areaLinkMutation,
		onSuccess: () => {
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

	const styles = StyleSheet.create({
		container: {
			justifyContent: 'space-evenly',
			alignItems: 'center',
			flex: 1,
		},
		heroGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 32,
		},
		textContainer: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 16,
			paddingHorizontal: 20,
		},
		textTitle: {
			fontSize: theme.fontLarge,
			fontWeight: '500',
			textAlign: 'center',
			color: theme.textPrimary,
		},
		textSubtitle: {
			fontSize: theme.fontBase,
			fontWeight: '400',
			textAlign: 'center',
			color: theme.textSecondary,
			paddingHorizontal: 20,
			lineHeight: 24,
		},
		buttonGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 12,
		},
	})

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
		<LinearGradient colors={['#f4f6f9', '#eef1fb']} style={{ flex: 1 }}>
			<SafeAreaView style={styles.container}>
				<View style={styles.heroGroup}>
					<CurrentLocationIllustration
						width={300}
						height={300}
						color={theme.illustrationPrimary}
					/>
					<View style={styles.textContainer}>
						<Text style={styles.textTitle}>Add your first area</Text>
						<Text style={styles.textSubtitle}>
							Each device controls one area of your irrigation system. Scan the
							QR code or enter your{' '}
							<Text
								style={{
									fontVariant: ['small-caps'],
									color: theme.textPrimary,
									fontWeight: '500',
								}}
							>
								Link Code
							</Text>{' '}
							to connect your device.
						</Text>
					</View>
				</View>
				<View style={styles.buttonGroup}>
					<HydroButton
						label="Add Area"
						onPress={() => bottomSheetRef.current?.expand()}
						iconPosition="right"
						icon={
							linkPending ? (
								<ActivityIndicator
									size="small"
									color={theme.buttonPrimaryText}
								/>
							) : (
								<MaterialIcons
									name="add"
									size={24}
									color={theme.buttonPrimaryText}
								/>
							)
						}
					/>
					<HydroButton
						label="Skip for now"
						onPress={() => router.replace('/(tabs)')}
						variant="secondary"
					/>
				</View>
				<HydroBottomSheet ref={bottomSheetRef} snapPoints={[400]}>
					<HydroButton
						label="Scan QR Code"
						modifier={['tall', 'full']}
						icon={
							<MaterialIcons
								name="qr-code-scanner"
								size={24}
								color={theme.buttonPrimaryText}
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
								backgroundColor: theme.border,
								height: 2,
								flex: 1,
							}}
						/>
						<Text style={{ color: theme.textSecondary }}>
							or enter manually
						</Text>
						<View
							style={{
								width: 'auto',
								backgroundColor: theme.border,
								height: 2,
								flex: 1,
							}}
						/>
					</View>
					<View style={{ gap: 20 }}>
						<View>
							<HydroBottomSheetInput
								label="Enter Link Code"
								value={linkCode}
								onChangeText={setLinkCode}
								onSubmitEditing={handleLinkCodeSubmit}
								labelBackground={theme.card}
							/>
						</View>
						<HydroSubmitButton
							modifier={['tall', 'full']}
							variant="secondary"
							onPress={handleLinkCodeSubmit}
						/>
					</View>
				</HydroBottomSheet>
			</SafeAreaView>
		</LinearGradient>
	)
}
