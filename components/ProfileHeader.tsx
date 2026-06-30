import { useTheme } from '@/context/ThemeContext'
import { View, Text, StyleSheet } from 'react-native'
import UserAvatar from './UserAvatar'

interface ProfileHeaderProps {
	email: string
	imageUrl?: string
}

export function ProfileHeader({ email, imageUrl }: ProfileHeaderProps) {
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
			<UserAvatar imageUrl={imageUrl} seed={email} size={72} />
			<Text style={[styles.email, { color: theme.colors.textSecondary }]}>
				{email}
			</Text>
		</View>
	)
}
