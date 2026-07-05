import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { profileQuery } from '@/queries/profile'
import { useTheme } from '@/context/ThemeContext'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AccountActionsCard } from '@/components/profile/AccountActionsCard'
import { profileUpdateFn } from '@/mutations/profile'
import * as Burnt from 'burnt'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SectionTitle from '@/components/ui/SectionTitle'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import { STICKY_BAR_HEIGHT } from '@/app/_layout'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { UserResponse } from '@/types/auth'
import { RefreshControl } from 'react-native-gesture-handler'
import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
import StatusScreen from '@/components/status/StatusScreen'

export interface ProfileInfo {
	fullName: string
	username: string
	phoneNumber: string
	address: string
	email?: string
	password?: string
	currentPassword?: string
}

export default function ProfileScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const router = useRouter()
	const {
		data: profile,
		isPending,
		error: profileLoadError,
	} = useQuery(profileQuery)
	const insets = useSafeAreaInsets()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const [profileState, setProfileState] = useState<ProfileInfo>({
		fullName: '',
		username: '',
		phoneNumber: '',
		address: '',
	})

	const { mutate, isPending: isProfileUpdating } = useMutation({
		...profileUpdateFn,
		mutationKey: ['profileUpdate'],
		onError: (error) => {
			console.error('Password update error:', error)
			Burnt.toast({
				title:
					error.message ??
					'An error occurred while updating your profile. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: UserResponse) => {
			Burnt.toast({
				title: 'Profile updated successfully',
				preset: 'done',
			})
			queryClient.setQueryData(['profile'], updatedUser)
			router.back()
		},
	})

	const onRefresh = async () => {
		setIsRefreshing(true)
		console.log('Refreshing profile data...')
		try {
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
		} catch (error) {
			console.error('Error refreshing profile:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	useEffect(() => {
		if (isPending || profileLoadError || !profile) return

		setProfileState({
			fullName: profile.fullName,
			username: profile.username,
			phoneNumber: profile.phoneNumber ?? '',
			address: profile.address ?? '',
		})
	}, [isPending, profileLoadError, profile])

	const handleInfoChange = (field: keyof ProfileInfo, value: string) => {
		setProfileState((prev) => ({ ...prev, [field]: value }))
	}

	const hasChanges =
		profile &&
		(profileState.fullName !== profile.fullName ||
			profileState.username !== profile.username ||
			profileState.phoneNumber !== (profile.phoneNumber ?? '') ||
			profileState.address !== (profile.address ?? ''))

	const handleDiscard = () => {
		if (!profile) return
		setProfileState({
			fullName: profile.fullName,
			username: profile.username,
			phoneNumber: profile.phoneNumber ?? '',
			address: profile.address ?? '',
		})
	}

	const handleSave = () => {
		Burnt.dismissAllAlerts()
		console.log('Saving profile changes:', profileState)
		mutate(profileState)
	}

	// --- Loading state ---
	if (isPending) {
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

	// --- Profile load error (connection/server issue) ---
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
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// --- Missing or unavailable profile data ---
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
				hint="Local features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				bottomOffset={STICKY_BAR_HEIGHT}
				keyboardShouldPersistTaps="handled"
				refreshControl={
					<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
				}
				contentContainerStyle={{
					flexGrow: 1,
					paddingHorizontal: theme.space.lg,
					paddingBottom: theme.space.lg,
					gap: theme.space.x2l,
				}}
			>
				<ProfileHeader email={profile.email} />

				<View style={{ gap: theme.space.x2l }}>
					<View>
						<SectionTitle text="Profile" />
						<EditableProfileInfoCard
							name={profileState.fullName}
							username={profileState.username}
							phoneNumber={profileState.phoneNumber}
							address={profileState.address}
							onInfoChange={handleInfoChange}
						/>
					</View>

					<View>
						<SectionTitle text="Account" />
						<AccountActionsCard
							onChangeEmail={() => router.push('/settings/change-email')}
							onChangePassword={() => router.push('/settings/change-password')}
						/>
					</View>
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				hasChanges={!!hasChanges}
				onSave={handleSave}
				onDiscard={handleDiscard}
				isLoading={isProfileUpdating}
				bottomInset={insets.bottom}
			/>
		</View>
	)
}
