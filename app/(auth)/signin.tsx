import { useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import {
	AuthError,
	fetchAuthSession,
	signIn,
	SignInInput,
	SignInOutput,
} from 'aws-amplify/auth'
import { useRouter } from 'expo-router'

import SpiralSvg from '@/assets/images/spiral-30-svgrepo-com.svg'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'
import { verifySyncFn } from '@/queries/auth'

interface SignInForm {
	username: string
	password: string
}

type ErrorState = Partial<Record<'username' | 'password', string>>

const signInErrors: Record<
	string,
	{ field: keyof ErrorState; message: string }
> = {
	NotAuthorizedException: {
		field: 'password',
		message: 'Incorrect email or password',
	},
	UserNotFoundException: {
		field: 'username',
		message: 'No account with that email',
	},
	UserNotConfirmedException: {
		field: 'username',
		message: 'Please verify your email before signing in',
	},
	TooManyRequestsException: {
		field: 'password',
		message: 'Too many attempts, try again shortly',
	},
}

export default function SignIn() {
	const theme = useTheme()
	const router = useRouter()
	const [form, setForm] = useState<SignInForm>({ username: '', password: '' })
	const [errorState, setErrorState] = useState<ErrorState>({})

	const { mutate, isPending } = useMutation<
		SignInOutput,
		AuthError,
		SignInInput
	>({
		mutationFn: (input) => signIn(input),
		onSuccess: async ({ isSignedIn, nextStep }) => {
			if (!isSignedIn || nextStep.signInStep !== 'DONE') {
				setErrorState({
					password: 'Sign-in requires an extra verification step',
				})
				return
			}

			try {
				const { tokens } = await fetchAuthSession()
				const idToken = tokens?.idToken?.toString()
				if (!idToken) {
					setErrorState({
						password: 'Could not establish a session, please try again',
					})
					return
				}

				await verifySyncFn()
				router.replace('/onboarding/onboarding4')
			} catch {
				setErrorState({
					password: 'Could not establish a session, please try again',
				})
			}
		},
		onError: (error) => {
			const known = signInErrors[error.name]
			if (known) {
				setErrorState((prev) => ({ ...prev, [known.field]: known.message }))
				return
			}
			setErrorState((prev) => ({
				...prev,
				password: 'Something went wrong, please try again',
			}))
		},
	})

	const handleInputChange = (field: keyof SignInForm, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	const handleSignIn = () => {
		const nextErrors: ErrorState = {}
		if (!form.username.trim() || !form.username.includes('@')) {
			nextErrors.username = 'Enter a valid email'
		}
		if (!form.password) nextErrors.password = 'Password is required'

		if (Object.keys(nextErrors).length > 0) {
			setErrorState(nextErrors)
			return
		}

		setErrorState({})
		mutate({ username: form.username, password: form.password })
	}

	const errorText = (field: keyof ErrorState) =>
		errorState[field] ? (
			<Text
				style={{
					color: theme.colors.fault,
					fontSize: theme.font.sm,
					marginTop: theme.space.x2s,
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
						justifyContent: 'center',
					}}
				>
					<View
						style={{
							backgroundColor: theme.colors.accentTint,
							borderRadius: theme.radius.card,
							width: 68,
							height: 68,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: theme.space.md,
						}}
					>
						<SpiralSvg width={36} height={36} color={theme.colors.accent} />
					</View>
					<Text
						style={{
							fontSize: theme.font.lg,
							fontWeight: theme.fontWeight.semibold,
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
							fontWeight: theme.fontWeight.regular,
							color: theme.colors.textSecondary,
							marginTop: theme.space.x2s,
						}}
					>
						Sign in to continue
					</Text>
				</View>

				<View style={{ width: '100%', gap: theme.space.x2l }}>
					<View>
						<Input
							label={t('auth.email')}
							value={form.username}
							keyboardType="email-address"
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('username', value)}
							labelBackground={theme.colors.surfaceRaised}
						/>
						{errorText('username')}
					</View>
					<View>
						<Input
							label={t('auth.password')}
							value={form.password}
							autoCapitalize="none"
							autoCorrect={false}
							autoComplete="password"
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.colors.surfaceRaised}
							onSubmitEditing={handleSignIn}
							textContentType="password"
							secureTextEntry
						/>
						{errorText('password')}
					</View>
				</View>

				<Button
					label={t('auth.signIn')}
					modifier={['full']}
					onPress={handleSignIn}
					iconPosition="right"
					loading={isPending}
					icon={
						<MaterialIcons
							name="arrow-forward"
							size={theme.space.iconSize}
							color={theme.colors.buttonPrimaryText}
						/>
					}
				/>
			</KeyboardAwareScrollView>
		</>
	)
}
