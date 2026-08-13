import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, Text, View } from 'react-native'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useDebounce } from 'use-debounce'

import Card from '@/components/layout/Card'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import StatusScreen from '@/components/status/StatusScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import SimpleCardItem from '@/components/ui/SimpleRowCard'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import { profileFileUploadFn } from '@/mutations/storage'
import { checkAvailabilityFn } from '@/queries/auth'
import { profileQueryFn } from '@/queries/profile'
import { AppError } from '@/types/api'
import type { UploadProfileImageVariables } from '@/types/storage'
import { ProfileUpdatePayload, profileUpdateSchema, User } from '@/types/user'
import resolveImageUrl from '@/utils/resolveImageUrl'

type ErrorState = Partial<Record<keyof ProfileUpdatePayload, string>>

export default function ProfileScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const router = useRouter()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const insets = useSafeAreaInsets()
	const [errorState, setErrorState] = useState<ErrorState>({})
	const [profileFormState, setProfileFormState] = useState<
		Partial<ProfileUpdatePayload>
	>({
		fullName: '',
		username: '',
		phoneNumber: '',
		address: '',
		imageUrl: '',
	})
	const [localImageFile, setLocalImageFile] = useState<{
		uri: string
		name: string
		type: string
	} | null>(null)
	const [debouncedUsername] = useDebounce(profileFormState.username ?? '', 400)

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
		// Only run check when profile exists, username changed, and the
		// debounced username meets basic length constraints.
		enabled: Boolean(
			profile?.username &&
			debouncedUsername !== profile?.username &&
			debouncedUsername.length >= 5 &&
			debouncedUsername.length <= 20,
		),
	})

	// Mutation for uploading profile image to the API
	const { mutateAsync: uploadProfileImageAsync, isPending: isUploadingImage } =
		useMutation({
			mutationKey: tanstackKeys.PROFILE_IMAGE_UPLOAD,
			mutationFn: ({ payload, userId }: UploadProfileImageVariables) =>
				profileFileUploadFn(payload, userId),
			onError: (error: AppError) => {
				Burnt.toast({
					title:
						error.code === 'UNKNOWN_ERROR'
							? 'An unknown error occurred while uploading your profile picture.'
							: error.message,
					preset: 'error',
				})
			},
			onSuccess: async (data) => {
				setProfileFormState((prev) => ({
					...prev,
					imageUrl: data.fileUrl,
				}))

				// Persist the returned file URL to the user's profile automatically
				try {
					if (profile?.id) {
						const fullUrl = resolveImageUrl(data.fileUrl) || data.fileUrl
						const updated = await profileUpdateFn({ imageUrl: fullUrl } as any)
						// Inject sent imageUrl into cache so UI shows it immediately
						queryClient.setQueryData(['profile'], {
							...updated,
							imageUrl: fullUrl,
						})

						Burnt.toast({ title: 'Profile picture saved', preset: 'done' })
					}
				} catch (err: any) {
					console.error('Error saving profile image URL:', err)
					// Let user know saving failed
					Burnt.toast({
						title: 'Failed to save profile picture',
						message: err?.message || 'Please try again',
						preset: 'error',
					})
				}
			},
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
		onSuccess: async (updatedUser: User, variables?: any) => {
			Burnt.toast({
				title: 'Profile updated successfully',
				preset: 'done',
			})
			const injectedImageUrl = variables?.imageUrl || updatedUser.imageUrl
			queryClient.setQueryData(['profile'], {
				...updatedUser,
				imageUrl: injectedImageUrl,
			})

			router.back()
		},
	})

	const [confirmingField, setConfirmingField] = useState<string | null>(null)

	// Per-field save handler — calls the API directly without navigating away.
	const handleFieldConfirm = async (field: string, value: string) => {
		if (!profile) return
		setConfirmingField(field)
		try {
			const payload = { [field]: value }
			await profileUpdateFn(payload as ProfileUpdatePayload)
			// Update the cache so the confirm button disappears immediately.
			queryClient.setQueryData(['profile'], (old: User | undefined) =>
				old ? { ...old, [field]: value } : old,
			)
			Burnt.toast({ title: 'Saved', preset: 'done' })
		} catch (err: any) {
			Burnt.toast({
				title: err?.message || 'Failed to save',
				preset: 'error',
			})
		} finally {
			setConfirmingField(null)
		}
	}

	// Handler for input value changes
	const handleInputChange = (
		field: keyof ProfileUpdatePayload,
		value: string,
	) => {
		setProfileFormState((prev) => ({ ...prev, [field]: value }))
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
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: 'images',
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			})
			if (!result.canceled && result.assets.length > 0) {
				if (result.assets.length > 1) {
					Burnt.alert({
						title: 'Multiple Images Selected',
						message: 'Please select only one image for your profile picture.',
					})
					return
				}
				const imageUri = result.assets[0].uri
				const filename = imageUri.split('/').pop() || 'profile.jpg'
				const match = /\.(\w+)$/.exec(filename)
				const type = match ? `image/${match[1]}` : 'image/jpeg'

				setLocalImageFile({ uri: imageUri, name: filename, type })
			} else {
				Burnt.alert({
					title: 'Image Selection Cancelled',
					message: 'No image was selected.',
				})
			}
		} catch (error) {
			console.error('Error picking image:', error)
			Burnt.alert({
				title: 'Image Selection Error',
				message:
					'An error occurred while selecting an image. Please try again.',
			})
		}
	}

	// Handlers for save and discard actions
	const handleSave = async () => {
		// Build base payload
		const basePayload: any = {
			fullName: profileFormState.fullName,
			username: profileFormState.username,
			phoneNumber: profileFormState.phoneNumber,
			address: profileFormState.address,
		}

		// If there's a picked image file, upload it first and include the returned URL
		try {
			if (localImageFile && profile?.id) {
				const uploadResult = await uploadProfileImageAsync({
					payload: localImageFile as any,
					userId: String(profile.id),
				})
				// Resolve file key to full URL
				basePayload.imageUrl =
					resolveImageUrl(uploadResult.fileUrl) || uploadResult.fileUrl
				setLocalImageFile(null)
			}
		} catch {
			// uploadProfileImageAsync will have already shown a toast on error
			return
		}

		const result = profileUpdateSchema.safeParse(basePayload)
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

		mutate(basePayload)
	}

	const handleDiscard = () => {
		if (!profile) return
		setProfileFormState({
			fullName: profile.fullName,
			username: profile.username,
			phoneNumber: profile.phoneNumber ?? '',
			address: profile.address ?? '',
		})
	}

	// Effect to initialize the input state with the fetched profile data
	useEffect(() => {
		if (loadProfilePending || profileLoadError || !profile) return

		// Defer setState to avoid synchronous state updates inside effects
		setTimeout(() =>
			setProfileFormState({
				fullName: profile.fullName,
				username: profile.username,
				phoneNumber: profile.phoneNumber ?? '',
				address: profile.address ?? '',
			}),
		)
	}, [loadProfilePending, profileLoadError, profile])

	// Effect to update error state based on availability checks and validation
	// results
	useEffect(() => {
		// Hold off validation until profile loads and input state is initialized
		if (!profile?.username || !profileFormState.username) return
		if (profileFormState.username !== debouncedUsername) return

		const payload = {
			fullName: profileFormState.fullName,
			username: profileFormState.username,
			phoneNumber: profileFormState.phoneNumber,
			address: profileFormState.address,
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
			// Defer setState to avoid synchronous state updates inside effects
			setTimeout(() => setErrorState(formattedErrors))
			return
		}

		// Check if the username has changed from the profile's username
		const isUsernameChanged = profile.username !== debouncedUsername
		if (!isUsernameChanged) {
			// Defer to avoid synchronous state update in effect
			setTimeout(() => setErrorState((prev) => ({ ...prev, username: '' })))
			return
		}

		// Username availability check
		if (
			isUsernameAvailable === false &&
			debouncedUsername !== profile.username
		) {
			// Defer to avoid synchronous state update in effect
			setTimeout(() =>
				setErrorState((prev) => ({
					...prev,
					username: 'Username is already taken',
				})),
			)
			return
		} else {
			// Defer to avoid synchronous state update in effect
			setTimeout(() => setErrorState((prev) => ({ ...prev, username: '' })))
		}

		// Validate the full name field
		const { success: isValidFullName, error: fullNameError } =
			profileUpdateSchema.shape.fullName.safeParse(profileFormState.fullName)

		if (!isValidFullName) {
			// Defer to avoid synchronous state update in effect
			setTimeout(() =>
				setErrorState((prev) => ({
					...prev,
					fullName: fullNameError?.issues[0]?.message ?? 'Invalid full name',
				})),
			)
		} else {
			setTimeout(() => setErrorState((prev) => ({ ...prev, fullName: '' })))
		}
	}, [
		isUsernameAvailable,
		profileFormState.username,
		debouncedUsername,
		profile?.username,
		profileFormState.fullName,
		profile?.fullName,
		profileFormState.phoneNumber,
		profileFormState.address,
		profile?.phoneNumber,
		profile?.address,
	])

	// Button state management logic
	const hasErrors = Object.values(errorState).some((message) => !!message)
	const hasChanges =
		profile &&
		(profileFormState.fullName !== profile.fullName ||
			profileFormState.username !== profile.username ||
			profileFormState.phoneNumber !== (profile.phoneNumber ?? '') ||
			profileFormState.address !== (profile.address ?? '') ||
			!!localImageFile)
	const hasMandatoryEmptyFields =
		!profileFormState.fullName || !profileFormState.username
	const isUsernameInputDebouncing =
		profileFormState.username !== debouncedUsername

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
				<ActivityIndicator size="large" color={theme.colors.accent} />
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
				variant="network-error"
				title="Profile Unavailable"
				subtitle="We couldn't load your profile. Check your connection and try again."
				hint="Only the local areas feature is available."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// Error state if the profile data is null or undefined
	if (!profile) {
		return (
			<StatusScreen
				variant="missing-data"
				title="Profile Data Unavailable"
				subtitle="Some profile data couldn't be loaded."
				hint="Only the local areas feature is available."
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
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						progressViewOffset={theme.space.x2l}
						colors={[theme.colors.accent]}
					/>
				}
			>
				<ProfileHeader
					fullName={profile.fullName}
					email={profile.email}
					imageUrl={localImageFile?.uri ?? profile.imageUrl ?? undefined}
					handleChooseImage={handleChooseImage}
				/>

				{isUploadingImage && (
					<View style={{ alignItems: 'center', marginTop: theme.space.sm }}>
						<Text style={{ color: theme.colors.textSecondary }}>
							Uploading image...
						</Text>
					</View>
				)}

				<View style={{ gap: theme.space.x2l }}>
					<View>
						<SectionTitle text="Profile" />
						<EditableProfileInfoCard
							fullName={profileFormState.fullName}
							username={profileFormState.username}
							phoneNumber={profileFormState.phoneNumber}
							address={profileFormState.address}
							onInfoChange={handleInputChange}
							errorState={errorState}
							initialValues={{
								fullName: profile.fullName,
								username: profile.username,
								phoneNumber: profile.phoneNumber ?? '',
								address: profile.address ?? '',
							}}
							onFieldConfirm={handleFieldConfirm}
							confirmingField={confirmingField}
						/>
					</View>

					<View>
						<SectionTitle text="Account" />
						<Card>
							<SimpleCardItem
								label="Change email"
								icon="email-outline"
								onPress={() =>
									router.push({ pathname: '/settings/change-email' } as any)
								}
							/>
							<SimpleCardItem
								label="Change password"
								icon="lock-outline"
								onPress={() =>
									router.push({ pathname: '/settings/change-password' } as any)
								}
							/>
							<SimpleCardItem
								label="Delete account"
								modifiers={['fault']}
								icon="account-remove-outline"
								onPress={() =>
									router.push({ pathname: '/settings/delete-account' } as any)
								}
							/>
						</Card>
					</View>
				</View>
			</KeyboardAwareScrollView>
		</>
	)
}
