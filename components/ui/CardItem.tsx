import { useTheme } from '@/context/ThemeContext'
import { MaterialIcons } from '@expo/vector-icons'
import { Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native'

interface CardItemProps {
	label?: string
	children?: React.ReactNode
	leadingIcon?: keyof typeof MaterialIcons.glyphMap
	iconColor?: string
	iconSize?: number
	flexDirection?: 'row' | 'column'
	extraStyles?: StyleProp<ViewStyle>
	onPress?: () => void
}

export default function CardItem({
	label,
	children,
	leadingIcon,
	iconColor,
	iconSize = 24,
	flexDirection = 'column',
	extraStyles,
	onPress,
}: CardItemProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		container: {
			flexDirection: flexDirection,
			alignItems: 'center',
			gap: theme.space.sm,
			paddingVertical: theme.space.lg,
			paddingHorizontal: theme.space.lg,
			flex: 1,
		},
		label: {
			fontSize: theme.font.xs,
			color: theme.colors.textMuted,
			textAlign: 'center',
		},
	})

	return (
		<Pressable style={[styles.container, extraStyles]} onPress={onPress}>
			{leadingIcon && (
				<MaterialIcons
					name={leadingIcon}
					size={iconSize}
					color={iconColor || theme.colors.accentBlue}
				/>
			)}
			{label && <Text style={styles.label}>{label}</Text>}
			{children}
		</Pressable>
	)
}
