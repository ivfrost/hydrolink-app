import { useState } from 'react'
import {
	ScrollView,
	View,
	Text,
	StyleSheet,
	StatusBar,
	KeyboardAvoidingView,
	Platform,
} from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { profileQuery } from '@/queries/profile'
import { useTheme } from '@/context/ThemeContext'
import { CredentialChangeHeader } from '@/components/profile/CredentialChangeHeader'
import { profileUpdateFn } from '@/mutations/profile'
import * as Burnt from 'burnt'
import { ProfileInfo } from './profile'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SectionTitle from '@/components/ui/SectionTitle'
import HydroHint from '@/components/ui/HintContainer'
import { EditableProfileInfoCard } from '@/components/profile/EditableProfileInfoCard'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'

export default function ChangePasswordScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { data: profile } = useQuery(profileQuery)
	const insets = useSafeAreaInsets()

	const [password, setPassword] = useState('')
	const [currentPassword, setCurrentPassword] = useState('')

	const isLengthValid = password.length >= 8 && password.length <= 42

	const { mutate, isPending: isUpdating } = useMutation({
		...profileUpdateFn,
		mutationKey: ['passwordUpdate'],
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
			} else {
				Burnt.toast({
					title: 'Failed to update password. Please try again',
					preset: 'error',
				})
			}
		},
		onSuccess: async () => {
			Burnt.toast({
				title: 'Password updated successfully',
				preset: 'done',
			})
			await queryClient.invalidateQueries({
				queryKey: ['profile'],
				refetchType: 'active',
			})
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
			</ScrollView>

			<StickyActionButtons
				hasChanges={
					password.trim() !== '' &&
					currentPassword.trim() !== '' &&
					isLengthValid
				}
				onSave={handleSave}
				onDiscard={() => router.back()}
				isLoading={isUpdating}
			/>
		</KeyboardAvoidingView>
	)
}
