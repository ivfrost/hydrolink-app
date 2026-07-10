import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface BadgeProps {
	icon: keyof typeof MaterialCommunityIcons.glyphMap
	text: string
	color: string
	borderColor?: string
	backgroundColor: string
}

export default function Badge({
	icon,
	text,
	color,
	borderColor,
	backgroundColor,
}: BadgeProps) {
	const theme = useTheme()

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.space.xs,
				paddingHorizontal: theme.space.sm,
				paddingVertical: theme.space.xs,
				borderRadius: theme.radius.pill,
				backgroundColor: backgroundColor,
				borderWidth: borderColor ? 1 : 0,
				borderColor: borderColor || 'transparent',
			}}
		>
			<MaterialCommunityIcons name={icon} size={16} color={color} />
			<View>
				<Text
					style={{
						fontSize: theme.font.xs,
						fontWeight: '600',
						color: color,
					}}
				>
					{text}
				</Text>
			</View>
		</View>
	)
}
