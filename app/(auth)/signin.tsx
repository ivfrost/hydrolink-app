import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useEffect, useState } from 'react'
import { View, Text, KeyboardAvoidingView, ScrollView } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { useAuth } from '@/stores/authStore'
import { LoginResponse } from '@/types/auth'
import * as SecureStore from 'expo-secure-store'
import { useOnboarding } from '@/stores/onboardingStore'
import { areasQuery } from '@/queries/areas'

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
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const hasOnboarded = useOnboarding().hasOnboarded
	const { data: areas, isPending: isPendingAreas } = useQuery(areasQuery)
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
			if (!accessToken || !refreshToken) {
				Burnt.toast({ title: 'Authentication error', preset: 'error' })
				return
			}
			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)

			if (areas && areas.details.length > 0) {
				if (!hasOnboarded) setHasOnboarded(true)
				router.replace('/(tabs)')
			} else {
				router.replace('/onboarding/onboarding3')
			}
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
		if (accessToken && areas && areas.details.length > 0) {
			if (!hasOnboarded) setHasOnboarded(true)
			router.replace('/(tabs)')
		} else if (accessToken && areas && areas.details.length === 0) {
			router.replace('/onboarding/onboarding3')
		}
	}, [router, accessToken, areas, hasOnboarded, setHasOnboarded])

	return (
		<KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: 'center',
					paddingTop: theme.space.md,
					paddingHorizontal: theme.space.x2l,
					paddingBottom: 80,
				}}
				keyboardShouldPersistTaps="handled"
			>
				<View style={{ width: '100%', alignItems: 'center', marginBottom: 32 }}>
					<View
						style={{
							backgroundColor: theme.colors.accentBlueLight,
							borderRadius: 18,
							width: 68,
							height: 68,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: 14,
						}}
					>
						<FontAwesome6
							name="droplet"
							size={30}
							color={theme.colors.accentBlue}
						/>
					</View>
					<Text
						style={{
							fontSize: theme.font.lg,
							fontWeight: '600',
							textAlign: 'center',
							color: theme.colors.textPrimary,
							letterSpacing: -0.5,
						}}
					>
						Welcome back
					</Text>
					<Text
						style={{
							fontSize: theme.font.sm,
							textAlign: 'center',
							fontWeight: '400',
							color: theme.colors.textSecondary,
							marginTop: 6,
						}}
					>
						Sign in to continue
					</Text>
				</View>

				{/* Inputs */}
				<View style={{ width: '100%', gap: 26 }}>
					<View>
						<Input
							label="Email"
							value={inputState.email}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('email', value)}
							labelBackground={theme.colors.modal}
						/>
						{errorState.email ? (
							<Text
								style={{
									color: theme.colors.fault,
									fontSize: theme.font.sm,
									marginTop: 4,
								}}
							>
								{errorState.email}
							</Text>
						) : null}
					</View>
					<View>
						<Input
							label="Password"
							value={inputState.password}
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.colors.modal}
							onSubmitEditing={signin}
							secureTextEntry
						/>
						{errorState.password ? (
							<Text
								style={{
									color: theme.colors.fault,
									fontSize: theme.font.sm,
									marginTop: 4,
								}}
							>
								{errorState.password}
							</Text>
						) : null}
					</View>
				</View>
				<View style={{ marginTop: theme.space.x2l }}>
					<Button
						label="Sign In"
						modifier={['full']}
						onPress={signin}
						iconPosition="right"
						loading={isPending}
						icon={
							<MaterialIcons
								name="arrow-forward"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}
