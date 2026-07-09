import { View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

interface CardIconProps {
	icon: React.ComponentProps<typeof MaterialIcons>['name']
	iconSize?: number
	color?: string
	backgroundColor?: string
}

export default function CardIcon({
	icon,
	iconSize = 20,
	color,
	backgroundColor,
}: CardIconProps) {
	const theme = useTheme()

	return (
		<View
			style={{
				width: theme.space.x3l,
				height: theme.space.x3l,
				borderRadius: theme.radius.fab,
				backgroundColor: backgroundColor ?? theme.colors.background,
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<MaterialIcons
				name={icon}
				size={iconSize}
				color={color ?? theme.colors.accentBlue}
			/>
		</View>
	)
}
