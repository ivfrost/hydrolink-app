import { Text } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import CardItem from './CardItem'

interface SimpleCardItemProps {
	label: string
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	modifiers?: string[]
	disabled?: boolean
	onPress?: () => void
}

export default function SimpleCardItem({
	label,
	icon,
	modifiers,
	disabled,
	onPress,
}: SimpleCardItemProps) {
	const theme = useTheme()

	return (
		<CardItem
			title={label}
			titleFontWeight="500"
			titleColor={
				modifiers?.includes('fault')
					? theme.colors.fault
					: theme.colors.textPrimary
			}
			icon={icon}
			statusColor={
				modifiers?.includes('fault')
					? theme.colors.fault
					: theme.colors.accent
			}
			statusBg={
				modifiers?.includes('fault')
					? theme.colors.faultBg
					: theme.colors.accentTint
			}
			rightElement={
				disabled ? (
					<Text
						style={{ fontSize: theme.font.xs, color: theme.colors.textMuted }}
					>
						Unavailable
					</Text>
				) : (
					<MaterialCommunityIcons
						name="chevron-right"
						size={theme.space.iconSize}
						color={theme.colors.textMuted}
					/>
				)
			}
			disabled={disabled}
			onPress={onPress}
		/>
	)
}
