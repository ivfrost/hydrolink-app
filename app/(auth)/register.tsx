import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useState } from 'react'
import { View, Text } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { MaterialIcons } from '@expo/vector-icons'
import { useOnboarding } from '@/stores/onboardingStore'
import { RegisterPayload, RegisterResponse } from '@/types/auth'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/stores/authStore'
import { areasQuery } from '@/queries/areas'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const registerSchema = z.object({
	email: z.email(),
	username: z.string().min(5).max(20),
	fullName: z.string().min(6).max(40),
	password: z.string().min(8).max(42),
	preferredLanguage: z.string().length(2),
})

type RegisterInput = z.infer<typeof registerSchema>
type ErrorState = Partial<Record<keyof RegisterInput, string>>

export default function Register() {
	const [inputState, setInputState] = useState({
		email: '',
		username: '',
		fullName: '',
		password: '',
		preferredLanguage: 'en',
	})
	const setAccessToken = useAuth().setAccessToken
	const [errorState, setErrorState] = useState<ErrorState>({})
	const theme = useTheme()
	const router = useRouter()
	const hasOnboarded = useOnboarding().hasOnboarded
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const { data: areas, isPending: isPendingAreas } = useQuery(areasQuery)

	const registerFn = async (
		input: RegisterInput,
	): Promise<RegisterResponse> => {
		try {
			const response = await fetch(`${API_BASE_URL}/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})
			console.log('Register response:', response)
			if (!response.ok) {
				throw new Error('REGISTER_FAILED')
			}
			return (await response.json()) as RegisterResponse
		} catch (e) {
			if (e instanceof TypeError) {
				throw new Error('NETWORK_ERROR')
			}
			throw e
		}
	}

	const { mutate, isPending } = useMutation<
		RegisterResponse,
		Error,
		RegisterPayload
	>({
		mutationKey: ['register'],
		mutationFn: registerFn,
		onError: (error) => {
			Burnt.toast({
				title:
					error.message === 'NETWORK_ERROR'
						? 'Could not connect to server'
						: 'Registration failed. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: async (data: RegisterResponse) => {
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

	const register = () => {
		if (isPendingAreas) return

		const { success, error, data } = registerSchema.safeParse(inputState)

		if (!success) {
			setErrorState(
				Object.fromEntries(
					error.issues.map(({ path, message }) => [path[0], message]),
				),
			)
			return
		}

		setErrorState({})
		mutate(data)
	}

	const handleInputChange = (field: string, value: string) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	const errorText = (field: keyof ErrorState) =>
		errorState[field] ? (
			<Text
				style={{
					color: theme.colors.fault,
					fontSize: theme.font.sm,
					marginTop: 4,
				}}
			>
				{errorState[field]}
			</Text>
		) : null

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					flexGrow: 1,
					paddingHorizontal: theme.space.lg,
					paddingBottom: theme.space.lg,
					gap: theme.space.x2l,
				}}
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
						Create your account
					</Text>
				</View>

				<View style={{ width: '100%', gap: 26 }}>
					<View>
						<Input
							label="Full name"
							value={inputState.fullName}
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('fullName', value)}
							labelBackground={theme.colors.modal}
						/>
						{errorText('fullName')}
					</View>
					<View>
						<Input
							label="Username"
							value={inputState.username}
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('username', value)}
							labelBackground={theme.colors.modal}
						/>
						{errorText('username')}
					</View>
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
						{errorText('email')}
					</View>
					<View>
						<Input
							label="Password"
							value={inputState.password}
							autoCapitalize="none"
							autoCorrect={false}
							secureTextEntry
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.colors.modal}
						/>
						{errorText('password')}
					</View>
				</View>

				<View style={{ marginTop: theme.space.x2l }}>
					<Button
						label="Create account"
						variant="primary"
						modifier={['full']}
						loading={isPending}
						onPress={register}
						disabled={isPendingAreas || isPending}
						iconPosition="right"
						icon={
							<MaterialIcons
								name="arrow-forward"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				</View>
			</KeyboardAwareScrollView>
		</View>
	)
}
