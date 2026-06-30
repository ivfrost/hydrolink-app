import { useState } from 'react'
import { ScrollView, View, KeyboardAvoidingView } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { profileQuery } from '@/queries/profile'
import { useTheme } from '@/context/ThemeContext'
import { profileUpdateFn } from '@/mutations/profile'
import * as Burnt from 'burnt'
import { ProfileInfo } from './profile'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import SectionTitle from '@/components/ui/SectionTitle'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'

export default function ChangeEmailScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { data: profile } = useQuery(profileQuery)

	const [email, setEmail] = useState('')
	const [currentPassword, setCurrentPassword] = useState('')
	const insets = useSafeAreaInsets()

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
		<KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{
					paddingHorizontal: theme.space.lg,
					paddingTop: theme.space.x2l,
					paddingBottom: insets.bottom + theme.space.lg,
					gap: theme.space.x2l,
				}}
				keyboardShouldPersistTaps="handled"
			>
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
			</ScrollView>

			<StickyActionButtons
				hasChanges={email.trim() !== '' || currentPassword.trim() !== ''}
				onSave={handleSave}
				onDiscard={() => router.back()}
				isLoading={isUpdating}
			/>
		</KeyboardAvoidingView>
	)
}
