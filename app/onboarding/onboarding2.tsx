import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/theme'
import { useRouter } from 'expo-router'
import { Text, StyleSheet, View, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import LoginIllustration from '@/assets/images/onboarding/undraw_login_weas.svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { useMutation, useQuery } from '@tanstack/react-query'
import HydroSubmitButton from '@/components/HydroSubmitButton'

export default function Onboarding1() {
	const router = useRouter()
	const theme = useTheme()
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

	interface LoginPayload {
		email: string
		password: string
	}

	interface LoginResponse {
		accessToken: string
		user: {
			id: number
			email: string
		}
	}

	const API_URL =
		Platform.OS === 'android'
			? 'http://192.168.1.124:3000'
			: 'http://localhost:3000'

	const handleNextStep = () => {
		// TODO: Push next onboard screen on successful login
		// login()
		router.push('/onboarding/onboarding3')
	}

	const login = () => {}

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
					<HydroButton label="Sign In" onPress={handleNextStep} />
					<HydroButton label="Create Account" variant="secondary" />
				</View>
			</SafeAreaView>
		</LinearGradient>
	)
}
