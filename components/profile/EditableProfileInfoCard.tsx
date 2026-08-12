import { View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { ProfileUpdatePayload } from '@/types/user'

import EditableInfoCardItem from '../ui/EditableInfoCardItem'

interface EditableInfoCardProps {
	fullName?: string
	username?: string
	email?: string
	password?: string
	currentPassword?: string
	phoneNumber?: string
	address?: string
	onInfoChange: (field: keyof ProfileUpdatePayload, value: string) => void
	isCredentialChanging?: boolean
	errorState?: Partial<Record<keyof ProfileUpdatePayload, string>>
	/** Original values from the server, used to detect changes per field. */
	initialValues?: Partial<Record<keyof ProfileUpdatePayload, string>>
	/** Called when the user taps a field's inline confirm button. */
	onFieldConfirm?: (field: string, value: string) => void
	/** Which field's confirm is currently saving (shows spinner). */
	confirmingField?: string | null
}

export function EditableProfileInfoCard({
	fullName,
	username,
	email,
	password,
	currentPassword,
	phoneNumber,
	address,
	onInfoChange,
	isCredentialChanging = false,
	errorState,
	initialValues,
	onFieldConfirm,
	confirmingField,
}: EditableInfoCardProps) {
	const theme = useTheme()

	return (
		<View
			style={{
				borderRadius: theme.radius.card,
				overflow: 'hidden',
				backgroundColor: theme.colors.card,
				width: '100%',
				elevation: 0,
			}}
		>
			{fullName !== undefined && (
				<EditableInfoCardItem
					label="Full name"
					text={fullName}
					onChangeText={(value) => onInfoChange('fullName', value)}
					editable
					error={errorState?.fullName}
					icon="account-outline"
					initialValue={initialValues?.fullName}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('fullName', v)
							: undefined
					}
					confirmLoading={confirmingField === 'fullName'}
				/>
			)}

			{username !== undefined && (
				<EditableInfoCardItem
					label="Username"
					text={username}
					onChangeText={(value) => onInfoChange('username', value)}
					autoCapitalize="none"
					editable
					error={errorState?.username}
					icon="at"
					initialValue={initialValues?.username}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('username', v)
							: undefined
					}
					confirmLoading={confirmingField === 'username'}
				/>
			)}

			{email !== undefined && (
				<EditableInfoCardItem
					label="New Email"
					text={email}
					onChangeText={(value) => onInfoChange('email', value)}
					textContentType="emailAddress"
					autoCapitalize="none"
					editable
					error={errorState?.email}
					icon="email-outline"
					initialValue={initialValues?.email}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('email', v)
							: undefined
					}
					confirmLoading={confirmingField === 'email'}
				/>
			)}

			{password !== undefined && (
				<EditableInfoCardItem
					label="New Password"
					text={password}
					onChangeText={(value) => onInfoChange('password', value)}
					secureTextEntry
					editable
					autoCapitalize="none"
					autoComplete="current-password"
					textContentType="password"
					error={errorState?.password}
					icon="lock-plus-outline"
					initialValue={initialValues?.password}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('password', v)
							: undefined
					}
					confirmLoading={confirmingField === 'password'}
				/>
			)}

			{isCredentialChanging && currentPassword !== undefined && (
				<EditableInfoCardItem
					label="Current Password (Required)"
					text={currentPassword}
					onChangeText={(value) =>
						onInfoChange('currentPassword', value)
					}
					secureTextEntry
					editable
					autoCapitalize="none"
					autoComplete="current-password"
					textContentType="password"
					error={errorState?.currentPassword}
					icon="shield-lock-outline"
				/>
			)}

			{phoneNumber !== undefined && (
				<EditableInfoCardItem
					label="Phone number"
					text={phoneNumber}
					onChangeText={(value) => onInfoChange('phoneNumber', value)}
					keyboardType="phone-pad"
					editable
					error={errorState?.phoneNumber}
					icon="phone-outline"
					initialValue={initialValues?.phoneNumber}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('phoneNumber', v)
							: undefined
					}
					confirmLoading={confirmingField === 'phoneNumber'}
				/>
			)}

			{address !== undefined && (
				<EditableInfoCardItem
					label="Address"
					text={address}
					onChangeText={(value) => onInfoChange('address', value)}
					editable
					error={errorState?.address}
					icon="map-marker-outline"
					initialValue={initialValues?.address}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('address', v)
							: undefined
					}
					confirmLoading={confirmingField === 'address'}
				/>
			)}
		</View>
	)
}
