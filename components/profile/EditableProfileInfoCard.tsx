import { useTheme } from '@/context/ThemeContext'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { ProfileInfo } from '@/app/settings/profile'
import EditableInfoCardItem from '../ui/EditableInfoCardItem'

interface EditableInfoCardProps {
	name?: string
	username?: string
	email?: string
	password?: string
	currentPassword?: string
	phoneNumber?: string
	address?: string
	onInfoChange: (field: keyof ProfileInfo, value: string) => void
	isCredentialChanging?: boolean
}

export function EditableProfileInfoCard({
	name,
	username,
	email,
	password,
	currentPassword,
	phoneNumber,
	address,
	onInfoChange,
	isCredentialChanging = false,
}: EditableInfoCardProps) {
	const theme = useTheme()

	return (
		<View
			style={{
				borderRadius: theme.radius.card,
				overflow: 'hidden',
				backgroundColor: theme.colors.card,
				width: '100%',
			}}
		>
			{name !== undefined && (
				<EditableInfoCardItem
					label="Full name"
					text={name}
					onChangeText={(value) => onInfoChange('fullName', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="account-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{username !== undefined && (
				<EditableInfoCardItem
					label="Username"
					text={username}
					onChangeText={(value) => onInfoChange('username', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="at"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{email !== undefined && (
				<EditableInfoCardItem
					label="Email address"
					text={email}
					onChangeText={(value) => onInfoChange('email', value)}
					textContentType="emailAddress"
					editable
					icon={
						<MaterialCommunityIcons
							name="email-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{password !== undefined && (
				<EditableInfoCardItem
					label="New Password"
					text={password}
					onChangeText={(value) => onInfoChange('password', value)}
					secureTextEntry
					editable
					autoComplete="current-password"
					textContentType="password"
					icon={
						<MaterialCommunityIcons
							name="lock-plus-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{isCredentialChanging && currentPassword !== undefined && (
				<EditableInfoCardItem
					label="Current Password (Required)"
					text={currentPassword}
					onChangeText={(value) => onInfoChange('currentPassword', value)}
					secureTextEntry
					editable
					autoComplete="current-password"
					textContentType="password"
					icon={
						<MaterialCommunityIcons
							name="shield-lock-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{phoneNumber !== undefined && (
				<EditableInfoCardItem
					label="Phone number"
					text={phoneNumber}
					onChangeText={(value) => onInfoChange('phoneNumber', value)}
					keyboardType="phone-pad"
					editable
					icon={
						<MaterialCommunityIcons
							name="phone-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}

			{address !== undefined && (
				<EditableInfoCardItem
					label="Site address"
					text={address}
					onChangeText={(value) => onInfoChange('address', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="map-marker-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
				/>
			)}
		</View>
	)
}
