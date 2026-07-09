import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useRouter } from 'expo-router'

import ChangePasswordIllustration from '@/assets/images/profile/undraw_enter-password_1kl4.svg'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import { profileQueryFn } from '@/queries/profile'
import { AppError } from '@/types/api'
import { ProfileUpdatePayload, profileUpdateSchema, User } from '@/types/user'

type ErrorState = {
	password?: string
	currentPassword?: string
}

export default function ChangePasswordScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const insets = useSafeAreaInsets()

	const [inputState, setInputState] = useState<Partial<ProfileUpdatePayload>>({
		password: '',
		currentPassword: '',
	})
	const [errorState, setErrorState] = useState<ErrorState>({})

	// Query for fetching user's profile data to preserve unchanged fields on save
	const { data: profile } = useQuery({
		queryKey: tanstackKeys.PROFILE,
		queryFn: profileQueryFn,
	})

	// Mutation for updating the user's password
	const { mutate, isPending: isProfileUpdating } = useMutation({
		mutationFn: profileUpdateFn,
		mutationKey: tanstackKeys.PASSWORD_UPDATE,
		onError: (error: AppError) => {
			// If the error was caused by invalid credentials, insert error message
			if (error.code === 'BAD_CREDENTIALS') {
				setErrorState((prev) => ({
					...prev,
					currentPassword: 'Current password is incorrect',
				}))
				return
			}

			// Otherwise, show a toast with the error message
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: User) => {
			Burnt.toast({
				title: 'Password updated successfully',
				preset: 'done',
			})
			// Instantly overwrite the local query data cache with the updated user
			queryClient.setQueryData(tanstackKeys.PROFILE, updatedUser)
			router.back()
		},
	})

	// Handler for input value changes
	const handleInputChange = (field: string, value: string) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	// Handlers for save and discard actions
	const handleSave = () => {
		Burnt.dismissAllAlerts()
		setErrorState({})

		const payload = {
			password: inputState.password,
			currentPassword: inputState.currentPassword,
		}

		const result = profileUpdateSchema.safeParse(payload)
		if (!result.success) {
			const formattedErrors: ErrorState = {}
			result.error.issues.forEach((issue) => {
				const field = issue.path[0] as keyof ErrorState
				if (field && !formattedErrors[field]) {
					formattedErrors[field] = issue.message
				}
			})
			setErrorState(formattedErrors)
			return
		}

		// Check if the new password is the same as the current one
		const isPasswordSameAsCurrent =
			inputState.password === inputState.currentPassword
		if (isPasswordSameAsCurrent) {
			setErrorState((prev) => ({
				...prev,
				password: 'New password cannot be the same as your current password',
			}))
			return
		}

		mutate(payload)
	}

	const handleDiscard = () => {
		if (!profile) return
		setInputState({ password: '', currentPassword: '' })
		setErrorState({})
	}

	// Effect to show error when passwords are the same
	useEffect(() => {
		if (!inputState.password || !inputState.currentPassword) return

		if (inputState.password === inputState.currentPassword) {
			setErrorState((prev) => ({
				...prev,
				password: 'New password cannot be the same as your current password',
			}))
		} else {
			setErrorState((prev) => ({ ...prev, password: '' }))
		}
	}, [inputState.password, inputState.currentPassword])

	// Button state management logic
	const hasErrors = Object.values(errorState).some((msg) => !!msg)
	const hasChanges =
		inputState.password && inputState.currentPassword !== inputState.password
	const hasEmptyFields = !inputState.password || !inputState.currentPassword
	const isButtonDisabled = hasErrors || !hasChanges || hasEmptyFields

	return (
		<>
			<KeyboardAwareScrollView bottomOffset={theme.space.stickyBarHeight}>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<ChangePasswordIllustration
						height={160}
						color={theme.colors.accentBlue}
					/>
				</View>
				<CredentialChangeHeader
					title="Change Password"
					description="Enter your new password. Your current password is required for security verification."
				/>
				<View>
					<SectionTitle text="Password Details" />
					<EditableProfileInfoCard
						password={inputState.password}
						currentPassword={inputState.currentPassword}
						onInfoChange={handleInputChange}
						isCredentialChanging={true}
						errorState={errorState}
					/>
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				disabled={isButtonDisabled}
				onSave={handleSave}
				onDiscard={handleDiscard}
				isLoading={isProfileUpdating}
				bottomInset={insets.bottom}
			/>
		</>
	)
}
