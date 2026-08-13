import { Text, TouchableOpacity, View } from 'react-native'

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

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.space.md,
			}}
		>
			<TouchableOpacity
				activeOpacity={0.9}
				hitSlop={10}
				onPress={handleChooseImage}
			>
				<UserAvatar imageUrl={imageUrl} seed={email} size={72} />
			</TouchableOpacity>
			<View style={{ flexShrink: 1 }}>
				{fullName && (
					<Text
						numberOfLines={1}
						style={{
							fontSize: theme.font.lg,
							fontWeight: '600',
							color: theme.colors.textPrimary,
						}}
					>
						{fullName}
					</Text>
				)}
				{email && (
					<Text
						numberOfLines={1}
						style={{
							fontSize: theme.font.sm,
							color: theme.colors.textSecondary,
							marginTop: theme.space.x2s,
						}}
					>
						{email}
					</Text>
				)}
			</View>
		</View>
	)
}
