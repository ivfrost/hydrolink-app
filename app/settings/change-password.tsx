import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { profileQuery } from '@/queries/profile'
import { useTheme } from '@/context/ThemeContext'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import { profileUpdateFn } from '@/mutations/profile'
import * as Burnt from 'burnt'
import { ProfileInfo } from './profile'
import SectionTitle from '@/components/ui/SectionTitle'
import HydroHint from '@/components/ui/HintContainer'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import ChangePasswordIllustration from '@/assets/images/profile/undraw_enter-password_1kl4.svg'
import { STICKY_BAR_HEIGHT } from '@/app/_layout'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { View } from 'react-native'
import { UserResponse } from '@/types/auth'

export default function ChangePasswordScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { data: profile } = useQuery(profileQuery)

	const [password, setPassword] = useState('')
	const [currentPassword, setCurrentPassword] = useState('')

	const isLengthValid = password.length >= 8 && password.length <= 42

	const { mutate, isPending: isProfileUpdating } = useMutation({
		...profileUpdateFn,
		mutationKey: ['passwordUpdate'],
		onError: (error) => {
			console.error('Profile update error:', error)
			Burnt.toast({
				title:
					error.message === 'UPDATE_FAILED'
						? 'Failed to update password. Please try again'
						: 'An unexpected error occurred. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: async (updatedUser: UserResponse) => {
			Burnt.toast({
				title: 'Password updated successfully',
				preset: 'done',
			})
			queryClient.setQueryData(['profile'], updatedUser)
			router.back()
		},
	})

	const handleInfoChange = (field: keyof ProfileInfo, value: string) => {
		if (field === 'password') {
			setPassword(value)
		} else if (field === 'currentPassword') {
			setCurrentPassword(value)
		}
	}

	const handleSave = () => {
		if (!isLengthValid) {
			Burnt.toast({
				title: 'Password must be between 8 and 42 characters',
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
			password: password.trim(),
			currentPassword: currentPassword.trim(),
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
						password={password}
						currentPassword={currentPassword}
						onInfoChange={handleInfoChange}
						isCredentialChanging={true}
					/>

					{password.length > 0 && (
						<HydroHint
							text={
								isLengthValid
									? 'Password matches the required length rule.'
									: `Must be between 8 and 42 characters (Current: ${password.length})`
							}
							variant={isLengthValid ? 'success' : 'warning'}
						/>
					)}
				</View>
			</KeyboardAwareScrollView>

			<StickyActionButtons
				hasChanges={
					password.trim() !== '' &&
					currentPassword.trim() !== '' &&
					isLengthValid
				}
				onSave={handleSave}
				onDiscard={() => router.back()}
				isLoading={isProfileUpdating}
			/>
		</View>
	)
}
