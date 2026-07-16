import { View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface HeadingIconProps {
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	statusColor: string
	statusBg: string
	iconSize?: number
	rounded?: boolean
}

export default function HeadingIcon({
	icon,
	statusColor,
	statusBg,
	iconSize = 20,
	rounded = false,
}: HeadingIconProps) {
	const theme = useTheme()
	return (
		<View
			style={{
				padding: iconSize > 20 ? theme.space.md : theme.space.sm,
				borderRadius: rounded ? theme.radius.pill : theme.radius.fab,
				backgroundColor: statusBg,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			{(() => {
				const iconName = icon.includes('/') ? icon.split('/')[1] : icon

				if (icon in MaterialCommunityIcons.glyphMap) {
					return (
						<MaterialCommunityIcons
							name={iconName as any}
							size={iconSize}
							color={statusColor}
						/>
					)
				} else {
					return (
						<MaterialIcons
							name={iconName as any}
							size={iconSize}
							color={statusColor}
						/>
					)
				}
			})()}
		</View>
	)
}
