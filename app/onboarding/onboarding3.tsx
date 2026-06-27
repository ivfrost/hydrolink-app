import HydroButton from '@/components/HydroButton'
import { useOnboarding } from '@/stores/onboardingStore'
import { useTheme } from '@/theme'
import { Text, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import CurrentLocationIllustration from '@/assets/images/onboarding/undraw_current-location_c8qn.svg'
import BottomSheet from '@gorhom/bottom-sheet'
import { useRef } from 'react'
import HydroBottomSheet from '@/components/HydroBottomSheet'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import HydroBottomSheetInput from '@/components/HydroBottomSheetInput'
import HydroSubmitButton from '@/components/HydroSubmitButton'

export default function Onboarding1() {
	const toggleOnboarding = useOnboarding().toggleOnboarding
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheet>(null)

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
		inputLabel: {
			fontSize: theme.fontSmall,
			fontWeight: '500',
			color: theme.textSecondary,
			marginBottom: 8,
		},
	})

	const handleSelectLinkMethod = () => {
		bottomSheetRef.current?.expand()
		toggleOnboarding()
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
					<HydroButton label="Add Area" onPress={handleSelectLinkMethod} />
					<HydroButton
						label="Skip for now"
						onPress={handleSelectLinkMethod}
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
						onPress={() => bottomSheetRef.current?.close()}
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
								label="Enter link code"
								value=""
								onChangeText={() => {}}
								onSubmitEditing={() => {}}
								labelBackground={theme.card}
							/>
						</View>
						<HydroSubmitButton
							modifier={['tall', 'full']}
							variant="secondary"
							onPress={() => bottomSheetRef.current?.close()}
						/>
					</View>
				</HydroBottomSheet>
			</SafeAreaView>
		</LinearGradient>
	)
}
