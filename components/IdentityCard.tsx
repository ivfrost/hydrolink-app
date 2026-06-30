import { useTheme } from '@/context/ThemeContext'
import { View, Text, StyleSheet } from 'react-native'
import UserAvatar from './UserAvatar'

interface ProfileHeaderProps {
	email: string
	imageUrl?: string
}

export function ProfileHeader({ email, imageUrl }: ProfileHeaderProps) {
	const theme = useTheme()
	return (
		<View style={styles.container}>
			<UserAvatar imageUrl={imageUrl} seed={email} size={72} />
			<Text style={[styles.email, { color: theme.colors.textSecondary }]}>
				{email}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		gap: 10,
		marginBottom: 24,
	},
	email: {
		fontSize: 14,
	},
})
