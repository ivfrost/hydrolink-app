import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

import { UserAvatar } from '../ui/UserAvatar'

interface ProfileHeaderProps {
	email: string
	fullName?: string
	imageUrl?: string
	handleChooseImage?: () => void
}

export function ProfileHeader({
	email,
	fullName,
	imageUrl,
	handleChooseImage,
}: ProfileHeaderProps) {
	const theme = useTheme()
	const styles = StyleSheet.create({
		container: {
			alignItems: 'center',
			gap: theme.space.sm,
		},
		fullName: {
			fontSize: theme.font.lg,
			fontWeight: '600',
			color: theme.colors.textPrimary,
		},
		email: {
			fontSize: theme.font.sm,
			fontWeight: '400',
			color: theme.colors.textSecondary,
		},
	})

	return (
		<View style={styles.container}>
			<TouchableOpacity
				activeOpacity={0.9}
				hitSlop={10}
				onPress={handleChooseImage}
			>
				<UserAvatar imageUrl={imageUrl} seed={email} size={86} />
			</TouchableOpacity>
			{fullName && <Text style={styles.fullName}>{fullName}</Text>}
			{email && <Text style={styles.email}>{email}</Text>}
		</View>
	)
}
