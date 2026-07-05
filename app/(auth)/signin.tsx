import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useState } from 'react'
import { View, Text } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import * as Burnt from 'burnt'
import { useAuth } from '@/stores/authStore'
import { LoginResponse } from '@/types/auth'
import * as SecureStore from 'expo-secure-store'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'

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
	const setAccessToken = useAuth().setAccessToken
	const signinFn = async (input: SignInInput): Promise<LoginResponse> => {
		try {
			const response = await fetch(`${API_BASE_URL}/users/auth`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-platform': 'react-native',
				},
				body: JSON.stringify(input),
			})

			const data = await response.json()
			console.log('data:', data)
			console.log('response.ok:', response.ok)

			if (!response.ok) {
				if (data.message?.includes('Invalid credentials')) {
					throw new Error('INVALID_CREDENTIALS')
				}
				throw new Error('UNKNOWN_ERROR')
			}

			return data as LoginResponse
		} catch (e) {
			if (e instanceof TypeError) {
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
			const tokens = data.details.tokens

			const accessToken = tokens.find((t) => t.type === 'AUTH_ACCESS_TOKEN')
			const refreshToken = tokens.find((t) => t.type === 'AUTH_REFRESH_TOKEN')

			if (!accessToken || !refreshToken) {
				Burnt.toast({ title: 'Authentication error', preset: 'error' })
				return
			}

			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)
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

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					paddingHorizontal: theme.space.x2l,
					paddingBottom: theme.space.x3l,
					gap: theme.space.x3l,
					flex: 1,
					justifyContent: 'center',
				}}
			>
				<View
					style={{
						width: '100%',
						alignItems: 'center',
						marginBottom: theme.space.lg,
					}}
				>
					<View
						style={{
							backgroundColor: theme.colors.accentBlueLight,
							borderRadius: 18,
							width: 68,
							height: 68,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: theme.space.md,
						}}
					>
						<MaterialCommunityIcons
							name="sprinkler-variant"
							size={40}
							color={theme.colors.accentBlue}
						/>
					</View>
					<Text
						style={{
							fontSize: theme.font.lg,
							fontWeight: '600',
							textAlign: 'center',
							color: theme.colors.textPrimary,
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
							marginTop: theme.space.x2s,
						}}
					>
						Sign in to continue
					</Text>
				</View>

				{/* Inputs */}
				<View style={{ width: '100%', gap: theme.space.x2l }}>
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
							autoComplete="password"
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.colors.modal}
							onSubmitEditing={signin}
							textContentType="password"
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
			</KeyboardAwareScrollView>
		</View>
	)
}
