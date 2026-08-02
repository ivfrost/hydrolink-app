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
				/>
			)}

			{email !== undefined && (
				<EditableInfoCardItem
					label="Email address"
					text={email}
					onChangeText={(value) => onInfoChange('email', value)}
					textContentType="emailAddress"
					autoCapitalize="none"
					editable
					error={errorState?.email}
					icon="email-outline"
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
				/>
			)}

			{isCredentialChanging && currentPassword !== undefined && (
				<EditableInfoCardItem
					label="Current Password (Required)"
					text={currentPassword}
					onChangeText={(value) => onInfoChange('currentPassword', value)}
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
				/>
			)}
		</View>
	)
}
