import {
	Pressable,
	View,
	Text,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from 'react-native'

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import { useTheme } from '@/context/ThemeContext'

import UserAvatar from '../ui/UserAvatar'

export interface UserCardProps {
	name: string
	email: string
	imageUrl?: string
	avatarSize?: number | undefined
	extraStyles?: StyleProp<ViewStyle>
	onPress?: () => void
}

export function UserCard({
	name,
	email,
	imageUrl,
	avatarSize,
	extraStyles,
	onPress,
}: UserCardProps) {
	const theme = useTheme()
	const styles = StyleSheet.create({
		card: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.card,
			borderRadius: theme.radius.card,
			padding: 16,
			gap: 14,
			elevation: 0,
		},
		info: {
			flex: 1,
		},
		name: {
			fontSize: theme.font.base,
			fontWeight: '600',
			color: theme.colors.textPrimary,
		},
		email: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	})

	return (
		<Pressable style={[styles.card, extraStyles]} onPress={onPress}>
			<UserAvatar imageUrl={imageUrl} seed={email} size={avatarSize} />
			<View style={styles.info}>
				<Text style={styles.name}>{name}</Text>
				<Text style={styles.email}>{email}</Text>
			</View>
			{onPress ? (
				<MaterialCommunityIcons
					name="chevron-right"
					size={24}
					color={theme.colors.textMuted}
				/>
			) : null}
		</Pressable>
	)
}
