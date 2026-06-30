// SettingsRow.tsx
import { useTheme } from '@/context/ThemeContext'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { View, Text, Pressable, StyleSheet } from 'react-native'

interface SettingsRowProps {
	label: string
	icon: keyof typeof MaterialIcons.glyphMap
	onPress?: () => void
}

export default function SettingRow({ label, icon, onPress }: SettingsRowProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.lg,
			paddingVertical: theme.space.lg,
			paddingHorizontal: theme.space.lg,
		},
		iconWrapper: {
			width: theme.space.x3l,
			height: theme.space.x3l,
			borderRadius: theme.radius.fab,
			backgroundColor: theme.colors.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
		},
		label: {
			flex: 1,
			fontSize: theme.font.base,
			color: theme.colors.textPrimary,
		},
	})

	return (
		<Pressable style={styles.row} onPress={onPress}>
			<View style={styles.iconWrapper}>
				<MaterialIcons name={icon} size={18} color={theme.colors.accentBlue} />
			</View>
			<Text style={styles.label}>{label}</Text>
			<MaterialIcons
				name="chevron-right"
				size={20}
				color={theme.colors.textMuted}
			/>
		</Pressable>
	)
}
