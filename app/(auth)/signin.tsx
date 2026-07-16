import { useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import * as SecureStore from 'expo-secure-store'

import SpiralSvg from '@/assets/images/spiral-30-svgrepo-com.svg'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { errorCodes, tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { signinFn } from '@/mutations/auth'
import { useAuth } from '@/stores/authStore'
import { AppError } from '@/types/api'
import { SignInPayload, SignInResponse, signInSchema } from '@/types/auth'

type ErrorState = Partial<Record<keyof SignInPayload, string>>

export default function SignIn() {
	const theme = useTheme()
	const [inputState, setInputState] = useState<SignInPayload>({
		email: '',
		password: '',
	})
	const [errorState, setErrorState] = useState<ErrorState>({})
	const setAccessToken = useAuth().setAccessToken

	// Mutation for signing in
	const { mutate, isPending } = useMutation<
		SignInResponse,
		AppError,
		SignInPayload
	>({
		mutationKey: tanstackKeys.SIGN_IN,
		mutationFn: signinFn,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === errorCodes.UNKNOWN_ERROR
						? 'An unknown error occurred. Please try again later.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (data: SignInResponse) => {
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
			const refreshToken = tokens.find((t) => t.type === 'AUTH_REFRESH_TOKEN')

			if (!accessToken || !refreshToken) {
				Burnt.toast({
					title: 'Authentication error. Please try again later.',
					preset: 'error',
				})
				return
			}

			setAccessToken(accessToken.value)
			await SecureStore.setItemAsync('refreshToken', refreshToken.value)
		},
	})

	// Handler for input value changes
	const handleInputChange = (field: keyof SignInPayload, value: string) => {
		setInputState((prev) => ({
			...prev,
			[field]: value,
		}))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	// Handler for clicking the sign-in button
	const signin = () => {
		const { success, error, data } = signInSchema.safeParse(inputState)

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

	return (
		<>
			<KeyboardAwareScrollView>
				<View
					style={{
						width: '100%',
						alignItems: 'center',
						marginBottom: theme.space.lg,
						justifyContent: 'center',
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
						<SpiralSvg width={36} height={36} color={theme.colors.accentBlue} />
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
		</>
	)
}
