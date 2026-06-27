import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/theme'
import { useRouter } from 'expo-router'
import { Text, StyleSheet, View, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import WebDevicesIllustration from '@/assets/images/onboarding/undraw_web-devices_i15y.svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/authStore'

export default function Onboarding1() {
	const router = useRouter()
	const theme = useTheme()
	const accessToken = useAuth().accessToken
	const styles = StyleSheet.create({
		container: {
			justifyContent: 'space-evenly',
			alignItems: 'center',
			flex: 1,
		},
		textHeading: {
			fontSize: theme.fontExtraLarge,
			fontWeight: '500',
			textAlign: 'center',
			color: theme.accent,
			letterSpacing: -0.4,
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

	const handleNextStep = () => {
		if (accessToken) {
			router.replace('/onboarding/onboarding3')
		} else {
			router.replace('/onboarding/onboarding2')
		}
	}

	return (
		<LinearGradient colors={['#f4f6f9', '#eef1fb']} style={{ flex: 1 }}>
			<SafeAreaView style={styles.container}>
				<Text style={styles.textHeading}>Hydrolink</Text>
				<View style={styles.heroGroup}>
					<WebDevicesIllustration
						width={300}
						height={230}
						color={theme.illustrationPrimary}
					/>
					<View style={styles.textContainer}>
						<Text style={styles.textTitle}>All your valves, one app.</Text>
						<Text style={styles.textSubtitle}>
							Connect every controller, zone, and sensor across your garden —
							and water smarter, automatically.
						</Text>
					</View>
				</View>
				<HydroButton label="Let's Get Started" onPress={handleNextStep} />
			</SafeAreaView>
		</LinearGradient>
	)
}
