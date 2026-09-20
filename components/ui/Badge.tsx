import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface BadgeProps {
	icon?: keyof typeof MaterialCommunityIcons.glyphMap
	iconSize?: number
	text: string
	color: string
	borderColor?: string
	backgroundColor: string
}

export default function Badge({
	icon,
	iconSize = 11,
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
				justifyContent: 'center',
				gap: theme.space.x2s,
				paddingHorizontal: theme.space.sm,
				paddingVertical: theme.space.x2s,
				borderRadius: theme.radius.pill,
				backgroundColor: backgroundColor,
				borderWidth: borderColor ? 1 : 0,
				borderColor: borderColor || 'transparent',
			}}
		>
			{icon && (
				<MaterialCommunityIcons name={icon} size={iconSize} color={color} />
			)}
			<View>
				<Text
					style={{
						fontSize: theme.font.xs,
						fontWeight: theme.fontWeight.bold,
						color: color,
						paddingEnd: icon ? theme.space.x3s : 0,
					}}
				>
					{text}
				</Text>
			</View>
		</View>
	)
}
