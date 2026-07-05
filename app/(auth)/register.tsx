import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { useEffect, useState } from 'react'
import { View, Text } from 'react-native'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import {
	RegisterInput,
	RegisterPayload,
	RegisterResponse,
	registerSchema,
	TokenResponse,
} from '@/types/auth'
import * as SecureStore from 'expo-secure-store'
import { useAuth } from '@/stores/authStore'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { checkAvailabilityQuery } from '@/queries/auth'
import { useDebounce } from 'use-debounce'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

type ErrorState = Partial<Record<keyof RegisterInput, string>>

export default function Register() {
	const [inputState, setInputState] = useState({
		email: '',
		username: '',
		fullName: '',
		password: '',
	})
	const setAccessToken = useAuth().setAccessToken
	const [errorState, setErrorState] = useState<ErrorState>({})
	const [emailValue, setEmailValue] = useState('')
	const [usernameValue, setUsernameValue] = useState('')
	const [debouncedEmail] = useDebounce(emailValue, 400)
	const [debouncedUsername] = useDebounce(usernameValue, 400)

	const theme = useTheme()
	const router = useRouter()

	const registerFn = async (
		input: RegisterInput,
	): Promise<RegisterResponse> => {
		try {
			const response = await fetch(`${API_BASE_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-platform': 'react-native',
				},
				body: JSON.stringify(input),
			})
			console.log('response.status:', response.status)

			let data: any = null
			try {
				data = await response.json()
			} catch {
				data = null
			}
			console.log('data:', data)
			if (!response.ok) {
				throw new Error(data?.message || 'REGISTER_FAILED')
			}

			return data as RegisterResponse
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
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (data: RegisterResponse) => {
			const accessToken = data.details.tokens.find(
				(t) => t.type === 'AUTH_ACCESS_TOKEN',
			)
			const refreshToken = data.details.tokens.find(
				(t) => t.type === 'AUTH_REFRESH_TOKEN',
			)
			const recoveryCodes: TokenResponse[] = data.details.tokens.filter(
				(t) => t.type === 'AUTH_RECOVERY_CODE',
			)

			if (!accessToken || !refreshToken || recoveryCodes.length === 0) {
				Burnt.toast({ title: 'Authentication error', preset: 'error' })
				return
			}

			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)

			// Navigate to the recovery codes screen and pass the recovery codes as a parameter
			router.replace({
				pathname: '/onboarding/onboarding3',
				params: {
					recoveryCodes: JSON.stringify(
						recoveryCodes.map((token) => token.value),
					),
				},
			})
		},
	})
	const isValidEmailFormat = (value: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

	const { data: isEmailAvailable, isFetching: emailChecking } = useQuery({
		...checkAvailabilityQuery(debouncedEmail),
		enabled: isValidEmailFormat(debouncedEmail),
	})
	const { data: isUsernameAvailable, isFetching: usernameChecking } = useQuery({
		...checkAvailabilityQuery(debouncedUsername),
		enabled: debouncedUsername.length > 5,
	})

	const register = () => {
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
		if (field === 'email') setEmailValue(value)
		if (field === 'username') setUsernameValue(value)
	}

	useEffect(() => {
		if (!isValidEmailFormat(emailValue) || emailValue !== debouncedEmail) return
		if (isEmailAvailable === false) {
			setErrorState((prev) => ({ ...prev, email: 'Email is already taken' }))
		} else if (isEmailAvailable === true) {
			setErrorState((prev) => ({ ...prev, email: '' }))
		}
	}, [isEmailAvailable, emailValue, debouncedEmail])

	useEffect(() => {
		if (usernameValue !== debouncedUsername) return
		if (isUsernameAvailable === false) {
			setErrorState((prev) => ({
				...prev,
				username: 'Username is already taken',
			}))
		} else if (isUsernameAvailable === true) {
			setErrorState((prev) => ({ ...prev, username: '' }))
		}
	}, [isUsernameAvailable, usernameValue, debouncedUsername])

	const hasErrors = Object.values(errorState).some((message) => !!message)

	const isButtonDisabled =
		isPending ||
		emailChecking ||
		usernameChecking ||
		hasErrors ||
		!inputState.email ||
		!inputState.username ||
		!inputState.fullName ||
		!inputState.password

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
						Create your account
					</Text>
				</View>

				{/* Inputs */}
				<View style={{ width: '100%', gap: theme.space.x2l }}>
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
						{usernameChecking && (
							<Text
								style={{
									color: theme.colors.textSecondary,
									fontSize: theme.font.sm,
									marginTop: 4,
								}}
							>
								Checking availability…
							</Text>
						)}
						{!usernameChecking &&
							usernameValue.length > 5 &&
							isUsernameAvailable === true && (
								<Text
									style={{
										color: theme.colors.success,
										fontSize: theme.font.sm,
										marginTop: 4,
									}}
								>
									Username available
								</Text>
							)}
						{!usernameChecking && errorText('username')}
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
						{emailChecking && (
							<Text
								style={{
									color: theme.colors.textSecondary,
									fontSize: theme.font.sm,
									marginTop: 4,
								}}
							>
								Checking availability…
							</Text>
						)}
						{!emailChecking && isEmailAvailable === true && (
							<Text
								style={{
									color: theme.colors.success,
									fontSize: theme.font.sm,
									marginTop: 4,
								}}
							>
								Email available
							</Text>
						)}
						{!emailChecking && errorText('email')}
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

				<Button
					label="Create account"
					variant="primary"
					modifier={['full']}
					loading={isPending}
					onPress={register}
					disabled={isButtonDisabled}
					iconPosition="right"
					icon={
						<MaterialIcons
							name="arrow-forward"
							size={24}
							color={
								isButtonDisabled
									? theme.colors.buttonDisabledText
									: theme.colors.buttonPrimaryText
							}
						/>
					}
				/>
			</KeyboardAwareScrollView>
		</View>
	)
}
