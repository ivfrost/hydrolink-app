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
			const errorMessage = error.message || 'UNKNOWN_ERROR'

			if (errorMessage.includes('Current password must be provided')) {
				Burnt.toast({
					title: 'Current password is required',
					preset: 'error',
				})
			} else if (errorMessage.includes('Invalid credentials')) {
				Burnt.toast({
					title: 'Current password is incorrect',
					preset: 'error',
				})
			} else if (errorMessage.includes('already in use')) {
				Burnt.toast({
					title: 'Email address is already in use',
					preset: 'error',
				})
			} else {
				Burnt.toast({
					title: 'Failed to update email. Please try again',
					preset: 'error',
				})
			}
		},
		onSuccess: async () => {
			Burnt.toast({
				title: 'Email updated successfully',
				preset: 'done',
			})
			// Invalidate query cache
			await queryClient.invalidateQueries({
				queryKey: ['profile'],
				refetchType: 'active',
			})
			// Navigate back
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

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email.trim())) {
			Burnt.toast({
				title: 'Please enter a valid email address',
				preset: 'error',
			})
			return
		}

		// Check if email is same as current
		if (email.trim().toLowerCase() === profile?.details?.email?.toLowerCase()) {
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
			fullName: profile?.details?.fullName || '',
			username: profile?.details?.username || '',
			phoneNumber: profile?.details?.phoneNumber || '',
			address: profile?.details?.address || '',
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
					paddingBottom: theme.space.lg,
					gap: theme.space.x2l,
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
					currentValue={profile?.details?.email}
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
