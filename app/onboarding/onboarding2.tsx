import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/theme'
import { useRouter } from 'expo-router'
import { Text, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LoginIllustration from '@/assets/images/onboarding/undraw_login_weas.svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
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
		buttonGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 12,
		},
	})

	useEffect(() => {
		if (accessToken) {
			router.replace('/onboarding/onboarding3')
		}
	}, [router, accessToken])

	return (
		<LinearGradient colors={['#f4f6f9', '#eef1fb']} style={{ flex: 1 }}>
			<SafeAreaView style={styles.container}>
				<View style={styles.heroGroup}>
					<LoginIllustration
						width={260}
						height={290}
						color={theme.illustrationPrimary}
					/>
					<View style={styles.textContainer}>
						<Text style={styles.textTitle}>Sign in to your account</Text>
						<Text style={styles.textSubtitle}>
							Your account keeps your devices together and under your control.
							An account is required to continue. You can create one for free.
						</Text>
					</View>
				</View>
				<View style={styles.buttonGroup}>
					<HydroButton
						label="Sign In"
						onPress={() => router.push('/(auth)/signin')}
					/>
					<HydroButton
						label="Create Account"
						variant="secondary"
						onPress={() => router.push('/(auth)/register')}
					/>
				</View>
			</SafeAreaView>
		</LinearGradient>
	)
}
