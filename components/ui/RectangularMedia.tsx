import { Pressable, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface RectangularMediaProps {
	width?: number | '100%'
	height?: number | 'auto'
	borderRadius?: number
	onPress?: () => void
	ringColor?: string
	children: React.ReactNode
	isFullWidth?: boolean
	elevation?: number
	aspectRatio?: number
}

export function RectangularMedia({
	width = 64,
	height = 64,
	borderRadius = 12,
	onPress,
	ringColor,
	children,
	isFullWidth = false,
	elevation,
	aspectRatio,
}: RectangularMediaProps) {
	const theme = useTheme()

	const ringPadding = 4
	const ringCol = ringColor || theme.colors.accentBlue

	// Handle full-width calculation dynamically
	const containerStyle = isFullWidth
		? {
				width: '100%' as const,
				...(aspectRatio
					? { aspectRatio }
					: { height: Number(height) + ringPadding * 2 }),
				borderRadius: borderRadius + ringPadding,
				borderWidth: 2,
				borderColor: ringCol,
				justifyContent: 'center' as const,
				alignItems: 'center' as const,
				elevation: elevation ?? 4,
			}
		: {
				width: (typeof width === 'number' ? width : 64) + ringPadding * 2,
				...(aspectRatio
					? { aspectRatio }
					: { height: Number(height) + ringPadding * 2 }),
				borderRadius: borderRadius + ringPadding,
				borderWidth: 2,
				borderColor: ringCol,
				justifyContent: 'center' as const,
				alignItems: 'center' as const,
				elevation: 4,
			}

	const innerStyle = isFullWidth
		? {
				width: '100%' as const,
				...(aspectRatio ? { aspectRatio } : { height }),
				borderRadius,
				overflow: 'hidden' as const,
				backgroundColor: theme.colors.card,
			}
		: {
				width: typeof width === 'number' ? width : 64,
				...(aspectRatio ? { aspectRatio } : { height }),
				borderRadius,
				overflow: 'hidden' as const,
				backgroundColor: theme.colors.card,
			}

	const content = (
		<View style={containerStyle}>
			<View style={innerStyle}>{children}</View>
		</View>
	)

	if (!onPress) return content

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => ({
				width: isFullWidth ? '100%' : undefined,
				opacity: pressed ? 0.85 : 1,
				transform: [{ scale: pressed ? 0.96 : 1 }],
			})}
		>
			{content}
		</Pressable>
	)
}
