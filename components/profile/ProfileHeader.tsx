import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

import UserAvatar from '../ui/UserAvatar'

interface ProfileHeaderProps {
	email: string
	imageUrl?: string
	handleChooseImage?: () => void
}

export function ProfileHeader({
	email,
	imageUrl,
	handleChooseImage,
}: ProfileHeaderProps) {
	const theme = useTheme()
	const styles = StyleSheet.create({
		container: {
			alignItems: 'center',
			gap: theme.space.sm,
		},
		email: {
			fontSize: theme.font.sm,
			fontWeight: '500',
		},
	})

	return (
		<View style={styles.container}>
			<TouchableOpacity
				activeOpacity={0.8}
				hitSlop={10}
				onPress={handleChooseImage}
			>
				<UserAvatar imageUrl={imageUrl} seed={email} size={72} />
			</TouchableOpacity>
			<Text style={[styles.email, { color: theme.colors.textSecondary }]}>
				{email}
			</Text>
		</View>
	)
}
