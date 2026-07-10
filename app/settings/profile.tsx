import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Text, View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useDebounce } from 'use-debounce'

import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
import Card from '@/components/layout/Card'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import StatusScreen from '@/components/status/StatusScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import SimpleCardItem from '@/components/ui/SimpleRowCard'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import { checkAvailabilityFn } from '@/queries/auth'
import { profileQueryFn } from '@/queries/profile'
import { AppError } from '@/types/api'
import { registerSchema } from '@/types/auth'
import { ProfileUpdatePayload, profileUpdateSchema, User } from '@/types/user'

type ErrorState = Partial<Record<keyof ProfileUpdatePayload, string>>

export default function ProfileScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const router = useRouter()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const insets = useSafeAreaInsets()
	const [errorState, setErrorState] = useState<ErrorState>({})
	const [inputState, setInputState] = useState<Partial<ProfileUpdatePayload>>({
		fullName: '',
		username: '',
		phoneNumber: '',
		address: '',
	})
	const [debouncedUsername] = useDebounce(inputState.username ?? '', 400)

	// Query for fetching user's profile data to preserve unchanged fields on save
	const {
		data: profile,
		isPending: loadProfilePending,
		error: profileLoadError,
	} = useQuery({
		queryKey: ['profile'],
		queryFn: profileQueryFn,
	})

	// Query for checking username availability
	const { data: isUsernameAvailable, isPending: usernameChecking } = useQuery({
		queryKey: ['validEmailUsername', debouncedUsername],
		queryFn: () => checkAvailabilityFn(debouncedUsername),
		// Only run check if username changed from profile and passes basic format
		// validation
		enabled:
			!!profile?.username &&
			debouncedUsername !== profile.username &&
			registerSchema.shape.username.safeParse(debouncedUsername).success,
	})

	// Mutation for updating the user's profile data
	const { mutate, isPending: isProfileUpdating } = useMutation({
		mutationKey: tanstackKeys.PROFILE_UPDATE,
		mutationFn: profileUpdateFn,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred while updating your profile.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: User) => {
			Burnt.toast({
				title: 'Profile updated successfully',
				preset: 'done',
			})
			queryClient.setQueryData(['profile'], updatedUser)
			router.back()
		},
	})

	// Handler for input value changes
	const handleInputChange = (
		field: keyof ProfileUpdatePayload,
		value: string,
	) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	// Handler to refresh the profile data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
		} catch (error) {
			console.error('Error refreshing profile:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	// Store result of image picker in state to be uploaded on save
	const handleChooseImage = async () => {
		if (Platform.OS === 'web') {
			return
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: 'images',
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		})
		if (!result.canceled) {
			const imageUri = result.assets[0].uri
			const filename = imageUri.split('/').pop() || 'profile.jpg'
			const match = /\.(\w+)$/.exec(filename)
			const type = match ? `image/${match[1]}` : 'image/jpeg'

			setInputState((prev) => ({
				...prev,
				profilePictureFile: {
					uri: imageUri,
					name: filename,
					type,
				},
			}))
		} else {
			Burnt.alert({
				title: 'Image Selection Cancelled',
				message: 'No image was selected.',
			})
		}
	}

	// Handlers for save and discard actions
	const handleSave = () => {
		const payload = {
			fullName: inputState.fullName,
			username: inputState.username,
			phoneNumber: inputState.phoneNumber,
			address: inputState.address,
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

		// Username availability check
		if (isUsernameAvailable === false) {
			setErrorState((prev) => ({
				...prev,
				username: 'Username is already taken',
			}))
			return
		}

		mutate(payload)
	}

	const handleDiscard = () => {
		if (!profile) return
		setInputState({
			fullName: profile.fullName,
			username: profile.username,
			phoneNumber: profile.phoneNumber ?? '',
			address: profile.address ?? '',
		})
	}

	// Effect to initialize the input state with the fetched profile data
	useEffect(() => {
		if (loadProfilePending || profileLoadError || !profile) return

		setInputState({
			fullName: profile.fullName,
			username: profile.username,
			phoneNumber: profile.phoneNumber ?? '',
			address: profile.address ?? '',
		})
	}, [loadProfilePending, profileLoadError, profile])

	// Effect to update error state based on availability checks and validation
	// results
	useEffect(() => {
		// Hold off validation until profile loads and input state is initialized
		if (!profile?.username || !inputState.username) return
		if (inputState.username !== debouncedUsername) return

		const payload = {
			fullName: inputState.fullName,
			username: inputState.username,
			phoneNumber: inputState.phoneNumber,
			address: inputState.address,
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

		// Check if the username has changed from the profile's username
		const isUsernameChanged = profile.username !== debouncedUsername
		if (!isUsernameChanged) {
			setErrorState((prev) => ({ ...prev, username: '' }))
			return
		}

		// Username availability check
		if (
			isUsernameAvailable === false &&
			debouncedUsername !== profile.username
		) {
			setErrorState((prev) => ({
				...prev,
				username: 'Username is already taken',
			}))
			return
		} else {
			setErrorState((prev) => ({ ...prev, username: '' }))
		}

		// Validate the full name field
		const { success: isValidFullName, error: fullNameError } =
			profileUpdateSchema.shape.fullName.safeParse(inputState.fullName)

		if (!isValidFullName) {
			setErrorState((prev) => ({
				...prev,
				fullName: fullNameError?.issues[0]?.message ?? 'Invalid full name',
			}))
		} else {
			setErrorState((prev) => ({ ...prev, fullName: '' }))
		}
	}, [
		isUsernameAvailable,
		inputState.username,
		debouncedUsername,
		profile?.username,
		inputState.fullName,
		profile?.fullName,
		inputState.phoneNumber,
		inputState.address,
		profile?.phoneNumber,
		profile?.address,
	])

	// Button state management logic
	const hasErrors = Object.values(errorState).some((message) => !!message)
	const hasChanges =
		profile &&
		(inputState.fullName !== profile.fullName ||
			inputState.username !== profile.username ||
			inputState.phoneNumber !== (profile.phoneNumber ?? '') ||
			inputState.address !== (profile.address ?? '') ||
			!!inputState.profilePictureFile)
	const hasMandatoryEmptyFields = !inputState.fullName || !inputState.username
	const isUsernameInputDebouncing = inputState.username !== debouncedUsername

	const isUsernameChecking =
		usernameChecking && debouncedUsername !== profile?.username

	const isButtonDisabled =
		hasErrors ||
		hasMandatoryEmptyFields ||
		!hasChanges ||
		isUsernameInputDebouncing ||
		isUsernameChecking

	// Loading state while fetching the profile data
	if (loadProfilePending) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading profile…
				</Text>
			</View>
		)
	}

	// Error state if the profile data fails to load
	if (profileLoadError) {
		return (
			<StatusScreen
				image={
					<ServerFailureIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Profile Unavailable"
				subtitle="Your profile couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality 
				may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// Error state if the profile data is null or undefined
	if (!profile) {
		return (
			<StatusScreen
				image={
					<FilesMissingIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Profile Data Unavailable"
				subtitle="Some profile data couldn’t be loaded."
				hint="Local features are still available, but some cloud functionality 
				may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	return (
		<>
			<KeyboardAwareScrollView
				extraStyles={{
					paddingTop: theme.space.lg,
				}}
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
				}
			>
				<ProfileHeader
					email={profile.email}
					imageUrl={
						inputState.profilePictureFile?.uri ??
						profile.profilePictureUrl ??
						undefined
					}
					handleChooseImage={handleChooseImage}
				/>

				<View style={{ gap: theme.space.x2l }}>
					<View>
						<SectionTitle text="Profile" />
						<EditableProfileInfoCard
							fullName={inputState.fullName}
							username={inputState.username}
							phoneNumber={inputState.phoneNumber}
							address={inputState.address}
							onInfoChange={handleInputChange}
							errorState={errorState}
						/>
					</View>

					<View>
						<SectionTitle text="Account" />
						<Card>
							<SimpleCardItem
								label="Change email"
								icon="email-outline"
								onPress={() => router.push('/settings/change-email')}
							/>
							<SimpleCardItem
								label="Change password"
								icon="lock-outline"
								onPress={() => router.push('/settings/change-password')}
							/>
							<SimpleCardItem
								label="Delete account"
								modifiers={['fault']}
								icon="account-remove-outline"
								onPress={() => router.push('/settings/delete-account')}
							/>
						</Card>
					</View>
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				disabled={isButtonDisabled}
				onSave={handleSave}
				onDiscard={handleDiscard}
				isLoading={isProfileUpdating || loadProfilePending}
				bottomInset={insets.bottom}
			/>
		</>
	)
}
