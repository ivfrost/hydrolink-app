import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useRouter } from 'expo-router'
import { useDebounce } from 'use-debounce'

import ChangeEmailIllustration from '@/assets/images/profile/undraw_message-sent_iyz6.svg'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import { checkAvailabilityFn } from '@/queries/auth'
import { profileQueryFn } from '@/queries/profile'
import { AppError } from '@/types/api'
import {
	ProfileUpdatePayload,
	profileUpdateSchema,
	User,
	userSchema,
} from '@/types/user'
import { isValidEmailFormat } from '@/utils/isValidEmailFormat'

type ErrorState = {
	email?: string
	currentPassword?: string
}

export default function ChangeEmailScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const insets = useSafeAreaInsets()
	const [errorState, setErrorState] = useState<ErrorState>({})
	const [inputState, setInputState] = useState<Partial<ProfileUpdatePayload>>({
		email: '',
		currentPassword: '',
	})
	const [debouncedEmail] = useDebounce(inputState.email ?? '', 400)

	// Query for fetching user's profile data to preserve unchanged fields on save
	const {
		data: profile,
		isPending: loadProfilePending,
		error: profileLoadError,
	} = useQuery({
		queryKey: ['profile'],
		queryFn: profileQueryFn,
	})

	// Query for checking email availability
	const { data: isEmailAvailable, isFetching: emailChecking } = useQuery({
		queryKey: [...tanstackKeys.VALID_EMAIL_USERNAME, 'email', debouncedEmail],
		queryFn: () => checkAvailabilityFn(debouncedEmail),
		enabled:
			isValidEmailFormat(debouncedEmail) &&
			// Only check if it's actually a new email
			debouncedEmail !== profile?.email,
	})

	// Mutation for updating the user's email
	const { mutate, isPending: isUpdating } = useMutation({
		mutationFn: profileUpdateFn,
		mutationKey: tanstackKeys.EMAIL_UPDATE,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred. Please try again.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: User) => {
			Burnt.toast({
				title: 'Email updated successfully',
				preset: 'done',
			})
			// Evict the old profile data and update with the new one
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
			email: inputState.email,
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

		// Check if the new email is the same as the current one
		const isEmailSameAsCurrent = profile?.email === inputState.email
		if (isEmailSameAsCurrent) {
			setErrorState((prev) => ({
				...prev,
				email: 'New email cannot be the same as your current email',
			}))
			return
		}

		// Email availability check
		if (isEmailAvailable === false && debouncedEmail !== profile?.email) {
			setErrorState((prev) => ({ ...prev, email: 'Email is already taken' }))
			return
		} else {
			setErrorState((prev) => ({ ...prev, email: '' }))
		}

		mutate(payload)
	}

	const handleDiscard = () => {
		if (!profile) return
		setInputState({ email: '', currentPassword: '' })
		setErrorState({})
	}

	useEffect(() => {
		if (!profile?.email || !inputState.email) return
		if (!inputState.email) {
			setErrorState((prev) => ({ ...prev, email: '' }))
			return
		}

		// Don't flag issues mid-typing before the debounce loop settles
		if (inputState.email !== debouncedEmail) return

		if (profile.email === debouncedEmail) {
			setErrorState((prev) => ({
				...prev,
				email: 'New email cannot be the same as your current email',
			}))
			return
		}

		const emailCheck = userSchema.shape.email.safeParse(debouncedEmail)
		if (!emailCheck.success) {
			setErrorState((prev) => ({
				...prev,
				email: emailCheck.error.issues[0]?.message ?? 'Invalid email',
			}))
			return
		}

		if (isEmailAvailable === false) {
			setErrorState((prev) => ({ ...prev, email: 'Email is already taken' }))
		} else {
			setErrorState((prev) => ({ ...prev, email: '' }))
		}
	}, [isEmailAvailable, inputState.email, debouncedEmail, profile?.email])

	// Guard routing fallback for failure configurations
	useEffect(() => {
		if (profileLoadError) {
			Burnt.toast({
				title: 'Failed to load profile. Please try again.',
				preset: 'error',
			})
			router.back()
		}
	}, [profileLoadError, router])

	// Button state management logic
	const hasErrors = Object.values(errorState).some((msg) => !!msg)
	const hasChanges =
		profile && inputState.email && inputState.email !== profile.email
	const hasEmptyFields = !inputState.email || !inputState.currentPassword
	const isEmailInputDebouncing = inputState.email !== debouncedEmail
	const isButtonDisabled =
		hasErrors ||
		hasEmptyFields ||
		!hasChanges ||
		isEmailInputDebouncing ||
		emailChecking

	if (loadProfilePending) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
				<Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
					Loading profile...
				</Text>
			</View>
		)
	}

	return (
		<>
			<KeyboardAwareScrollView bottomOffset={theme.space.stickyBarHeight}>
				<View
					style={{
						justifyContent: 'center',
						alignItems: 'center',
						paddingVertical: 20,
					}}
				>
					<ChangeEmailIllustration
						height={180}
						color={theme.colors.accentBlue}
					/>
				</View>
				<CredentialChangeHeader
					title="Change Email"
					description="Enter your new email address. Your current password is required for security verification."
					currentValue={profile?.email}
				/>
				<View>
					<SectionTitle text="Email Details" />
					<EditableProfileInfoCard
						email={inputState.email}
						currentPassword={inputState.currentPassword}
						onInfoChange={handleInputChange}
						isCredentialChanging={true}
						errorState={errorState}
					/>
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				disabled={isButtonDisabled}
				isLoading={isUpdating}
				onSave={handleSave}
				onDiscard={handleDiscard}
				bottomInset={insets.bottom}
			/>
		</>
	)
}
