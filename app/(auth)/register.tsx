import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { useDebounce } from 'use-debounce'

import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { registerFn } from '@/mutations/auth'
import { checkAvailabilityFn } from '@/queries/auth'
import { useAuth } from '@/stores/authStore'
import { AppError } from '@/types/api'
import {
	RegisterPayload,
	RegisterResponse,
	registerSchema,
	TokenResponse,
} from '@/types/auth'
import { isValidEmailFormat } from '@/utils/isValidEmailFormat'

type ErrorState = Partial<Record<keyof RegisterPayload, string>>

export default function Register() {
	const theme = useTheme()
	const router = useRouter()
	const setAccessToken = useAuth().setAccessToken
	const [errorState, setErrorState] = useState<ErrorState>({})
	const [inputState, setInputState] = useState<Partial<RegisterPayload>>({
		email: '',
		username: '',
		fullName: '',
		password: '',
	})
	const [debouncedEmail] = useDebounce(inputState.email ?? '', 400)
	const [debouncedUsername] = useDebounce(inputState.username ?? '', 400)

	// Mutation for registering a new user
	const { mutate, isPending } = useMutation<
		RegisterResponse,
		AppError,
		RegisterPayload
	>({
		mutationKey: tanstackKeys.REGISTER,
		mutationFn: registerFn,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred. Please try again later.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (data: RegisterResponse) => {
			if (data.error !== null || !data.details) {
				Burnt.toast({
					title:
						data.message ||
						'An unknown error occurred. Please try again later.',
					preset: 'error',
				})
				return
			}
			const tokens = data.details.tokens

			const accessToken = tokens.find((t) => t.type === 'AUTH_ACCESS_TOKEN')
			const refreshToken = data.details.tokens.find(
				(t) => t.type === 'AUTH_REFRESH_TOKEN',
			)
			const recoveryCodes: TokenResponse[] = data.details.tokens.filter(
				(t) => t.type === 'AUTH_RECOVERY_CODE',
			)

			if (!accessToken || !refreshToken || recoveryCodes.length === 0) {
				Burnt.toast({
					title: 'Authentication error. Please try again later.',
					preset: 'error',
				})
				return
			}

			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)

			// Pass recovery codes to the next onboarding step via query params
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

	// Queries for checking email and username availability
	const { data: isEmailAvailable, isFetching: emailChecking } = useQuery({
		queryKey: [...tanstackKeys.VALID_EMAIL_USERNAME, debouncedEmail],
		queryFn: () => checkAvailabilityFn(debouncedEmail),
		enabled: isValidEmailFormat(debouncedEmail),
	})
	const { data: isUsernameAvailable, isFetching: usernameChecking } = useQuery({
		queryKey: [...tanstackKeys.VALID_EMAIL_USERNAME, debouncedUsername],
		queryFn: () => checkAvailabilityFn(debouncedUsername),
		enabled: registerSchema.shape.username.safeParse(debouncedUsername).success,
	})

	// Handler for input value changes
	const handleInputChange = (field: keyof RegisterPayload, value: string) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	// Handler for clicking the register button
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

	// Effects to update error state based on availability checks
	useEffect(() => {
		if (inputState.email !== debouncedEmail) return
		if (isEmailAvailable === false) {
			setErrorState((prev) => ({ ...prev, email: 'Email is already in use' }))
		} else if (isEmailAvailable === true) {
			setErrorState((prev) => ({ ...prev, email: '' }))
		}
	}, [isEmailAvailable, inputState.email, debouncedEmail])
	useEffect(() => {
		if (inputState.username !== debouncedUsername) return
		if (isUsernameAvailable === false) {
			setErrorState((prev) => ({
				...prev,
				username: 'Username is already taken',
			}))
		} else if (isUsernameAvailable === true) {
			setErrorState((prev) => ({ ...prev, username: '' }))
		}
	}, [isUsernameAvailable, inputState.username, debouncedUsername])

	// Button state management logic
	const hasErrors = Object.values(errorState).some((message) => !!message)
	const hasEmptyFields =
		!inputState.email ||
		!inputState.username ||
		!inputState.fullName ||
		!inputState.password
	const checkPending = emailChecking || usernameChecking

	const isButtonDisabled =
		hasErrors || hasEmptyFields || checkPending || isPending

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
		<>
			<KeyboardAwareScrollView>
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
						{!usernameChecking && isUsernameAvailable === true && (
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
		</>
	)
}
