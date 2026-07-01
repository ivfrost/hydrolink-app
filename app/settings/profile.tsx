import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
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
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { data: profile, isPending, error } = useQuery(profileQuery)
	const insets = useSafeAreaInsets()

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
			Burnt.toast({
				title:
					error.message === 'UPDATE_FAILED'
						? 'Failed to update profile. Please try again'
						: 'An unexpected error occurred. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: async () => {
			Burnt.toast({
				title: 'Profile updated successfully',
				preset: 'done',
			})

			// Instantly overwrite the local query data cache to turn off "hasChanges" state immediately
			queryClient.setQueryData(['profile'], (oldData: any) => {
				if (!oldData) return oldData
				return {
					...oldData,
					details: {
						...oldData.details,
						fullName: profileState.fullName,
						username: profileState.username,
						phoneNumber: profileState.phoneNumber,
						address: profileState.address,
					},
				}
			})

			// Refresh from server silently in the background
			queryClient.invalidateQueries({
				queryKey: ['profile'],
				refetchType: 'active',
			})
		},
	})

	useEffect(() => {
		if (isPending || error || !profile) return

		setProfileState({
			fullName: profile.details.fullName,
			username: profile.details.username,
			phoneNumber: profile.details.phoneNumber ?? '',
			address: profile.details.address ?? '',
		})
	}, [isPending, error, profile])

	const handleInfoChange = (field: keyof ProfileInfo, value: string) => {
		setProfileState((prev) => ({ ...prev, [field]: value }))
	}

	const hasChanges =
		profile &&
		(profileState.fullName !== profile.details.fullName ||
			profileState.username !== profile.details.username ||
			profileState.phoneNumber !== (profile.details.phoneNumber ?? '') ||
			profileState.address !== (profile.details.address ?? ''))

	const handleDiscard = () => {
		if (!profile) return
		setProfileState({
			fullName: profile.details.fullName,
			username: profile.details.username,
			phoneNumber: profile.details.phoneNumber ?? '',
			address: profile.details.address ?? '',
		})
	}

	const handleSave = () => {
		Burnt.dismissAllAlerts()
		mutate(profileState)
	}

	const styles = StyleSheet.create({
		centered: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			gap: 12,
			paddingHorizontal: 20,
			backgroundColor: theme.colors.background,
		},
	})

	if (isPending) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading profile...
				</Text>
			</View>
		)
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<Text
					style={{ color: theme.colors.textSecondary, textAlign: 'center' }}
				>
					Couldn't load your profile. Pull to retry or check your connection.
				</Text>
			</View>
		)
	}

	if (!profile) {
		return (
			<View style={styles.centered}>
				<Text style={{ color: theme.colors.textSecondary }}>
					No profile data found.
				</Text>
			</View>
		)
	}

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				bottomOffset={STICKY_BAR_HEIGHT}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					flexGrow: 1,
					paddingHorizontal: theme.space.lg,
					paddingBottom: theme.space.lg,
					gap: theme.space.x2l,
				}}
			>
				<ProfileHeader email={profile.details.email} />

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
