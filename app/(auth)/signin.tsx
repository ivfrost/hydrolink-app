import HydroButton from '@/components/HydroButton'
import HydroInput from '@/components/HydroInput'
import { useTheme } from '@/theme'
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { useAuth } from '@/stores/authStore'
import { LoginResponse } from '@/types/auth'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(8).max(42),
})
type SignInInput = z.infer<typeof loginSchema>

type ErrorState = Partial<Record<keyof z.infer<typeof loginSchema>, string>>

export default function SignIn() {
	const theme = useTheme()
	const [inputState, setInputState] = useState({
		email: '',
		password: '',
	})
	const [errorState, setErrorState] = useState<ErrorState>({})
	const router = useRouter()
	const setAccessToken = useAuth().setAccessToken
	const accessToken = useAuth().accessToken
	const signinFn = async (input: SignInInput): Promise<LoginResponse> => {
		try {
			const response = await fetch(`${API_BASE_URL}/users/auth`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})
			if (!response.ok) {
				throw new Error('INVALID_CREDENTIALS')
			}
			return await response.json()
		} catch (e) {
			if (e instanceof TypeError) {
				// fetch throws TypeError on network failure
				throw new Error('NETWORK_ERROR')
			}
			throw e
		}
	}
	const { mutate, isPending } = useMutation({
		mutationKey: ['signin'],
		mutationFn: signinFn,
		onError: (error) => {
			Burnt.toast({
				title:
					error.message === 'NETWORK_ERROR'
						? 'Could not connect to server'
						: 'Invalid email or password',
				preset: 'error',
			})
		},
		onSuccess: async (data: LoginResponse) => {
			const accessToken = data.details.find(
				(t) => t.type === 'AUTH_ACCESS_TOKEN',
			)
			const refreshToken = data.details.find(
				(t) => t.type === 'AUTH_REFRESH_TOKEN',
			)
			console.log('Access Token:', accessToken)
			console.log('Refresh Token:', refreshToken)
			if (!accessToken || !refreshToken) {
				Burnt.toast({ title: 'Authentication error', preset: 'error' })
				return
			}
			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)
			router.replace('/onboarding/onboarding3')
		},
	})

	const signin = () => {
		const { success, error, data } = loginSchema.safeParse(inputState)

		if (!success) {
			setErrorState(
				Object.fromEntries(
					error.issues.map(({ path, message }) => [path[0], message]),
				),
			)
			return
		}

		setErrorState({ email: '', password: '' })
		mutate(data)
	}

	const handleInputChange = (field: string, value: string) => {
		setInputState((prevState) => ({
			...prevState,
			[field]: value,
		}))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	useEffect(() => {
		if (accessToken) {
			router.replace('/onboarding/onboarding3')
		}
	}, [router, accessToken])

	const styles = StyleSheet.create({
		groupSpacer: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 38,
			width: '100%',
		},
	})
	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				paddingTop: 12,
				paddingHorizontal: 26,
				paddingBottom: 80,
			}}
		>
			<View style={styles.groupSpacer}>
				{/* Logo + heading */}
				<View style={{ width: '100%', alignItems: 'center' }}>
					<View
						style={{
							backgroundColor: theme.accentBlueLight,
							borderRadius: 18,
							width: 68,
							height: 68,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 14,
						}}
					>
						<FontAwesome6 name="droplet" size={30} color={theme.accentBlue} />
					</View>
					<Text
						style={{
							fontSize: theme.fontLarge,
							fontWeight: '600',
							textAlign: 'center',
							color: theme.textPrimary,
							letterSpacing: -0.5,
						}}
					>
						Welcome back
					</Text>
					<Text
						style={{
							fontSize: theme.fontSmall,
							textAlign: 'center',
							fontWeight: '400',
							color: theme.textSecondary,
							marginTop: 6,
						}}
					>
						Sign in to continue
					</Text>
				</View>

				{/* Inputs */}
				<View style={{ width: '100%', gap: 26 }}>
					<View>
						<HydroInput
							label="Email"
							value={inputState.email}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('email', value)}
							labelBackground={theme.modalBackground}
						/>
						{errorState.email ? (
							<Text
								style={{
									color: theme.fault,
									fontSize: theme.fontSmall,
									marginTop: 4,
								}}
							>
								{errorState.email}
							</Text>
						) : null}
					</View>
					<View>
						<HydroInput
							label="Password"
							value={inputState.password}
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.modalBackground}
							onSubmitEditing={signin}
							secureTextEntry
						/>
						{errorState.password ? (
							<Text
								style={{
									color: theme.fault,
									fontSize: theme.fontSmall,
									marginTop: 4,
								}}
							>
								{errorState.password}
							</Text>
						) : null}
					</View>
				</View>
				<HydroButton
					label="Sign In"
					modifier={['full']}
					onPress={signin}
					iconPosition="right"
					loading={isPending}
					icon={
						<MaterialIcons
							name="arrow-forward"
							size={24}
							color={theme.buttonPrimaryText}
						/>
					}
				/>
			</View>
		</View>
	)
}
