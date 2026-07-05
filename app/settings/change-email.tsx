import { useState } from 'react'
import { View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { profileQuery } from '@/queries/profile'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import * as Burnt from 'burnt'
import { ProfileInfo } from './profile'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import SectionTitle from '@/components/ui/SectionTitle'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import ChangeEmailIllustration from '@/assets/images/profile/undraw_message-sent_iyz6.svg'
import { STICKY_BAR_HEIGHT } from '@/app/_layout'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { UserResponse } from '@/types/auth'

export default function ChangeEmailScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { data: profile } = useQuery(profileQuery)

	const [email, setEmail] = useState('')
	const [currentPassword, setCurrentPassword] = useState('')

	const { mutate, isPending: isUpdating } = useMutation({
		...profileUpdateFn,
		mutationKey: ['emailUpdate'],
		onError: (error) => {
			console.error('Email update error:', error)
			Burnt.toast({
				title:
					error.message === 'UPDATE_FAILED'
						? 'Failed to update email. Please try again'
						: 'An unexpected error occurred. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: UserResponse) => {
			Burnt.toast({
				title: 'Email updated successfully',
				preset: 'done',
			})
			queryClient.setQueryData(['profile'], updatedUser)
			router.back()
		},
	})

	const handleInfoChange = (field: keyof ProfileInfo, value: string) => {
		if (field === 'email') {
			setEmail(value)
		} else if (field === 'currentPassword') {
			setCurrentPassword(value)
		}
	}

	const handleSave = () => {
		if (!email || email.trim() === '') {
			Burnt.toast({
				title: 'Please enter a new email address',
				preset: 'error',
			})
			return
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email.trim())) {
			Burnt.toast({
				title: 'Please enter a valid email address',
				preset: 'error',
			})
			return
		}

		// Check if email is same as current
		if (email.trim().toLowerCase() === profile?.email?.toLowerCase()) {
			Burnt.toast({
				title: 'New email is the same as current email',
				preset: 'error',
			})
			return
		}

		if (!currentPassword || currentPassword.trim() === '') {
			Burnt.toast({
				title: 'Please enter your current password',
				preset: 'error',
			})
			return
		}

		Burnt.dismissAllAlerts()
		mutate({
			email: email.trim(),
			currentPassword: currentPassword.trim(),
			// Keep other fields to avoid clearing them
			fullName: profile?.fullName || '',
			username: profile?.username || '',
			phoneNumber: profile?.phoneNumber || '',
			address: profile?.address || '',
		})
	}

	return (
		<View style={{ flex: 1 }}>
			<KeyboardAwareScrollView
				bottomOffset={STICKY_BAR_HEIGHT}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{
					flexGrow: 1,
					paddingHorizontal: theme.space.lg,
					paddingBottom: theme.space.x3l,
					justifyContent: 'center',
					gap: theme.space.x3l,
				}}
			>
				<View style={{ justifyContent: 'center', alignItems: 'center' }}>
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
						email={email}
						currentPassword={currentPassword}
						onInfoChange={handleInfoChange}
						isCredentialChanging={true}
					/>
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				hasChanges={email.trim() !== '' || currentPassword.trim() !== ''}
				onSave={handleSave}
				onDiscard={() => router.back()}
				isLoading={isUpdating}
			/>
		</View>
	)
}
