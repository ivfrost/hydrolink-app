import { useTheme } from '@/theme'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Pressable, View, Text, StyleSheet, Image } from 'react-native'
import UserAvatar from './UserAvatar'

interface UserCardProps {
	name: string
	email: string
	avatarUrl?: string
	avatarSize?: number | undefined
	onPress?: () => void
}

export function UserCard({
	name,
	email,
	avatarUrl,
	avatarSize,
	onPress,
}: UserCardProps) {
	const theme = useTheme()
	const styles = StyleSheet.create({
		card: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.card,
			borderRadius: theme.cardBorderRadius,
			padding: 16,
			gap: 14,
		},
		info: {
			flex: 1,
		},
		name: {
			fontSize: theme.fontBase,
			fontWeight: '600',
			color: theme.textPrimary,
		},
		email: {
			fontSize: 13,
			color: theme.textSecondary,
			marginTop: 2,
		},
	})

	return (
		<Pressable style={styles.card} onPress={onPress}>
			<UserAvatar seed={avatarUrl} size={avatarSize} />
			<View style={styles.info}>
				<Text style={styles.name}>{name}</Text>
				<Text style={styles.email}>{email}</Text>
			</View>
			<MaterialCommunityIcons
				name="chevron-right"
				size={24}
				color={theme.textMuted}
			/>
		</Pressable>
	)
}
