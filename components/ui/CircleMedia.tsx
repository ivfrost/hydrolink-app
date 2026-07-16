import { Pressable, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface CircleMediaProps {
	size?: number
	onPress?: () => void
	ringColor?: string
	children: React.ReactNode
}

export function CircleMedia({
	size = 64,
	onPress,
	ringColor,
	children,
}: CircleMediaProps) {
	const theme = useTheme()

	const ringSize = size + 8
	const ringCol = ringColor || theme.colors.accentBlue

	const content = (
		<View
			style={{
				width: ringSize,
				height: ringSize,
				borderRadius: ringSize / 2,
				borderWidth: 2,
				borderColor: ringCol,
				justifyContent: 'center',
				alignItems: 'center',
				elevation: 4,
			}}
		>
			<View
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
					overflow: 'hidden',
					backgroundColor: theme.colors.card,
				}}
			>
				{children}
			</View>
		</View>
	)

	if (!onPress) return content

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => ({
				opacity: pressed ? 0.85 : 1,
				transform: [{ scale: pressed ? 0.96 : 1 }],
			})}
		>
			{content}
		</Pressable>
	)
}
