import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import CardItem from './CardItem'

interface SimpleCardItemProps {
	label: string
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	modifiers?: string[]
	onPress?: () => void
}

export default function SimpleCardItem({
	label,
	icon,
	modifiers,
	onPress,
}: SimpleCardItemProps) {
	const theme = useTheme()

	return (
		<CardItem
			title={label}
			titleFontWeight="400"
			titleColor={
				modifiers?.includes('fault')
					? theme.colors.fault
					: theme.colors.textPrimary
			}
			icon={icon}
			statusColor={
				modifiers?.includes('fault')
					? theme.colors.fault
					: theme.colors.accentBlue
			}
			statusBg={
				modifiers?.includes('fault')
					? theme.colors.faultBg
					: theme.colors.accentBlueLight
			}
			rightElement={
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={theme.colors.textMuted}
				/>
			}
			onPress={onPress}
		/>
	)
}
