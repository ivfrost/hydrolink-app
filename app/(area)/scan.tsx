import { View, StyleSheet } from 'react-native'

import { CameraView, useCameraPermissions } from 'expo-camera'
import { useLocalSearchParams, useRouter } from 'expo-router'

import QrCodeIllustration from '@/assets/images/onboarding/undraw_qr-code-scan_bewe.svg'
import OnboardContainer from '@/components/onboard/OnboardContainer'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Button from '@/components/ui/Button'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

export default function AreaQRScan() {
	const [permission, requestPermission] = useCameraPermissions()
	const router = useRouter()
	const theme = useTheme()
	const origin = useLocalSearchParams<{ from?: string }>().from

	// Get back to the origin screen with the scanned code as a query param
	const handleScan = (code: string) => {
		router.dismissTo({
			pathname:
				origin === 'onboarding'
					? '/onboarding/onboarding4'
					: origin === 'areas'
						? '/(tabs)/areas'
						: '/(tabs)/areas',
			params: { scanned: code },
		})
	}

	if (!permission?.granted) {
		return (
			<OnboardContainer>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						gap: theme.space.xl,
					}}
				>
					<QrCodeIllustration height={240} color={theme.colors.accent} />
					<OnboardTextWrapper>
						<Title text={t('areas.cameraAccessNeeded')} />
						<Subtitle text={t('areas.cameraScanHint')} />
					</OnboardTextWrapper>
				</View>
				<Button
					label={t('areas.allowCameraAccess')}
					onPress={requestPermission}
				/>
			</OnboardContainer>
		)
	}
	return (
		<CameraView
			style={StyleSheet.absoluteFill}
			facing="back"
			barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
			onBarcodeScanned={({ data }) => {
				handleScan(data)
			}}
		/>
	)
}
