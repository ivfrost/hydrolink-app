import HydroButton from '@/components/HydroButton'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useRef } from 'react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import QrCodeIllustration from '@/assets/images/onboarding/undraw_qr-code-scan_bewe.svg'
import { useTheme } from '@/theme'
export default function Link() {
	const [permission, requestPermission] = useCameraPermissions()
	const scannedRef = useRef(false)
	const router = useRouter()
	const theme = useTheme()
	const styles = StyleSheet.create({
		container: {
			justifyContent: 'space-evenly',
			alignItems: 'center',
			flex: 1,
			paddingTop: 12,
			paddingHorizontal: 26,
		},
		heroGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 22,
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
	})

	if (!permission?.granted) {
		return (
			<View style={styles.container}>
				<View style={styles.heroGroup}>
					<QrCodeIllustration height={240} color={theme.illustrationPrimary} />
					<View style={styles.textContainer}>
						<Text style={styles.textTitle}>Camera access needed</Text>
						<Text style={styles.textSubtitle}>
							We need access to your camera to scan the QR code on your device.
						</Text>
					</View>
				</View>
				<HydroButton
					label="Allow camera access"
					onPress={requestPermission}
					modifier={['full']}
				/>
			</View>
		)
	}
	return (
		<CameraView
			style={StyleSheet.absoluteFill}
			facing="back"
			barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
			onBarcodeScanned={({ data }) => {
				if (scannedRef.current) return
				scannedRef.current = true
				// validate data and navigate
				console.log('Scanned:', data)
				router.replace('/(tabs)')
			}}
		/>
	)
}
