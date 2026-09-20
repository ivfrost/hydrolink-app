import { useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import {
	AuthError,
	confirmSignUp,
	ConfirmSignUpInput,
	ConfirmSignUpOutput,
	resendSignUpCode,
	signUp,
	SignUpInput,
	SignUpOutput,
} from 'aws-amplify/auth'
import * as Burnt from 'burnt'
import { useRouter } from 'expo-router'

import SpiralSvg from '@/assets/images/spiral-30-svgrepo-com.svg'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

type Step = 'signup' | 'confirm'

interface SignUpForm {
	fullName: string
	username: string
	email: string
	password: string
}

type Field = 'fullName' | 'username' | 'email' | 'password' | 'confirmationCode'
type ErrorState = Partial<Record<Field, string>>

// Cognito exception names surfaced by Amplify's AuthError, mapped to the field
// they belong to and friendly copy to show the user.
const signUpErrors: Record<string, { field: Field; message: string }> = {
	UsernameExistsException: {
		field: 'email',
		message: 'An account with this email already exists',
	},
	InvalidPasswordException: {
		field: 'password',
		message: 'Password does not meet the requirements',
	},
	InvalidParameterException: {
		field: 'email',
		message: 'Please check your details and try again',
	},
	LimitExceededException: {
		field: 'password',
		message: 'Too many attempts, try again shortly',
	},
	TooManyRequestsException: {
		field: 'password',
		message: 'Too many attempts, try again shortly',
	},
}

const confirmErrors: Record<string, { field: Field; message: string }> = {
	CodeMismatchException: {
		field: 'confirmationCode',
		message: 'Incorrect confirmation code',
	},
	ExpiredCodeException: {
		field: 'confirmationCode',
		message: 'That code has expired, request a new one',
	},
	TooManyRequestsException: {
		field: 'confirmationCode',
		message: 'Too many attempts, try again shortly',
	},
}

export default function Register() {
	const theme = useTheme()
	const router = useRouter()
	const [step, setStep] = useState<Step>('signup')
	const [form, setForm] = useState<SignUpForm>({
		fullName: '',
		username: '',
		email: '',
		password: '',
	})
	const [confirmationCode, setConfirmationCode] = useState('')
	const [errorState, setErrorState] = useState<ErrorState>({})

	const handleInputChange = (field: keyof SignUpForm, value: string) => {
		setForm((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	const { mutate: signUpMutate, isPending: signUpPending } = useMutation<
		SignUpOutput,
		AuthError,
		SignUpInput
	>({
		mutationFn: (input) => signUp(input),
		onSuccess: ({ nextStep }) => {
			if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
				Burnt.toast({
					title: 'A confirmation code was sent to your email.',
					preset: 'done',
				})
				setStep('confirm')
			}
		},
		onError: (error) => {
			const known = signUpErrors[error.name]
			if (known) {
				setErrorState((prev) => ({ ...prev, [known.field]: known.message }))
				return
			}
			Burnt.toast({
				title: 'Something went wrong, please try again',
				preset: 'error',
			})
		},
	})

	const { mutate: confirmMutate, isPending: confirmPending } = useMutation<
		ConfirmSignUpOutput,
		AuthError,
		ConfirmSignUpInput
	>({
		mutationFn: (input) => confirmSignUp(input),
		onSuccess: ({ isSignUpComplete }) => {
			if (isSignUpComplete) {
				Burnt.toast({
					title: 'Account confirmed! You can now sign in.',
					preset: 'done',
				})
				router.replace('/(auth)/signin')
			}
		},
		onError: (error) => {
			const known = confirmErrors[error.name]
			if (known) {
				setErrorState((prev) => ({ ...prev, [known.field]: known.message }))
				return
			}
			Burnt.toast({
				title: 'Something went wrong, please try again',
				preset: 'error',
			})
		},
	})

	const { mutate: resendMutate, isPending: resendPending } = useMutation<
		void,
		AuthError,
		string
	>({
		mutationFn: async (username) => {
			await resendSignUpCode({ username })
		},
		onSuccess: () => {
			Burnt.toast({
				title: 'A new code was sent to your email.',
				preset: 'done',
			})
		},
		onError: () => {
			Burnt.toast({
				title: 'Could not resend the code, please try again',
				preset: 'error',
			})
		},
	})

	const handleSignUp = () => {
		const nextErrors: ErrorState = {}
		if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
		if (form.username.trim().length < 5) {
			nextErrors.username = 'Username must be at least 5 characters'
		}
		if (!form.email.trim() || !form.email.includes('@')) {
			nextErrors.email = 'Enter a valid email'
		}
		if (!form.password) nextErrors.password = 'Password is required'

		if (Object.keys(nextErrors).length > 0) {
			setErrorState(nextErrors)
			return
		}

		setErrorState({})
		signUpMutate({
			username: form.email,
			password: form.password,
			options: {
				userAttributes: {
					email: form.email,
					name: form.fullName,
					preferred_username: form.username,
				},
			},
		})
	}

	const handleConfirm = () => {
		if (!confirmationCode.trim()) {
			setErrorState((prev) => ({
				...prev,
				confirmationCode: 'Enter the code from your email',
			}))
			return
		}
		setErrorState((prev) => ({ ...prev, confirmationCode: '' }))
		confirmMutate({ username: form.email, confirmationCode })
	}

	const isSignUpDisabled =
		!form.fullName ||
		!form.username ||
		!form.email ||
		!form.password ||
		signUpPending
	const isConfirmDisabled = !confirmationCode || confirmPending

	const errorText = (field: Field) =>
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
						{step === 'signup' ? 'Create your account' : 'Confirm your email'}
					</Text>
					{step === 'confirm' && (
						<Text
							style={{
								fontSize: theme.font.sm,
								textAlign: 'center',
								fontWeight: theme.fontWeight.regular,
								color: theme.colors.textSecondary,
								marginTop: theme.space.x2s,
							}}
						>
							Enter the code we sent to {form.email}
						</Text>
					)}
				</View>

				{step === 'signup' ? (
					<View style={{ width: '100%', gap: theme.space.x2l }}>
						<View>
							<Input
								label={t('auth.fullName')}
								value={form.fullName}
								autoCorrect={false}
								onChangeText={(value) => handleInputChange('fullName', value)}
								labelBackground={theme.colors.surfaceOverlay}
							/>
							{errorText('fullName')}
						</View>
						<View>
							<Input
								label={t('auth.username')}
								value={form.username}
								autoCapitalize="none"
								autoCorrect={false}
								onChangeText={(value) => handleInputChange('username', value)}
								labelBackground={theme.colors.surfaceOverlay}
							/>
							{errorText('username')}
						</View>
						<View>
							<Input
								label={t('auth.email')}
								value={form.email}
								keyboardType="email-address"
								autoCapitalize="none"
								autoCorrect={false}
								onChangeText={(value) => handleInputChange('email', value)}
								labelBackground={theme.colors.surfaceOverlay}
							/>
							{errorText('email')}
						</View>
						<View>
							<Input
								label={t('auth.password')}
								value={form.password}
								autoCapitalize="none"
								autoCorrect={false}
								secureTextEntry
								onChangeText={(value) => handleInputChange('password', value)}
								onSubmitEditing={handleSignUp}
								labelBackground={theme.colors.surfaceOverlay}
							/>
							{errorText('password')}
						</View>
					</View>
				) : (
					<View style={{ width: '100%', gap: theme.space.x2l }}>
						<View>
							<Input
								label={t('auth.confirmationCode')}
								value={confirmationCode}
								keyboardType="number-pad"
								autoCapitalize="none"
								autoCorrect={false}
								onChangeText={(value) => {
									setConfirmationCode(value)
									setErrorState((prev) => ({
										...prev,
										confirmationCode: '',
									}))
								}}
								onSubmitEditing={handleConfirm}
								labelBackground={theme.colors.surfaceOverlay}
							/>
							{errorText('confirmationCode')}
						</View>
						<Button
							label={resendPending ? 'Sending…' : 'Resend code'}
							variant="tertiary"
							onPress={() => resendMutate(form.email)}
							disabled={resendPending}
						/>
					</View>
				)}

				{step === 'signup' ? (
					<Button
						label={t('auth.createAccount')}
						variant="primary"
						modifier={['full']}
						loading={signUpPending}
						onPress={handleSignUp}
						disabled={isSignUpDisabled}
						iconPosition="right"
						icon={
							<MaterialIcons
								name="arrow-forward"
								size={theme.space.iconSize}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				) : (
					<Button
						label={t('auth.confirm')}
						variant="primary"
						modifier={['full']}
						loading={confirmPending}
						onPress={handleConfirm}
						disabled={isConfirmDisabled}
						iconPosition="right"
						icon={
							<MaterialIcons
								name="arrow-forward"
								size={theme.space.iconSize}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				)}
			</KeyboardAwareScrollView>
		</>
	)
}
