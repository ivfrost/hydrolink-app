import { useTheme } from '@/context/ThemeContext'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'

type HintVariant = 'info' | 'warning' | 'error' | 'success'

interface HydroHintProps {
	text: string
	variant?: HintVariant
}

export default function HydroHint({ text, variant = 'info' }: HydroHintProps) {
	const theme = useTheme()

	const variantColor: Record<HintVariant, string> = {
		info: theme.colors.textMuted,
		warning: theme.colors.warning,
		error: theme.colors.fault,
		success: theme.colors.success,
	}

	const variantIcon: Record<HintVariant, keyof typeof MaterialIcons.glyphMap> =
		{
			info: 'info-outline',
			warning: 'warning-amber',
			error: 'error-outline',
			success: 'check-circle-outline',
		}

	const color = variantColor[variant]

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: 12,
			marginLeft: 6,
			gap: 6,
		},
		text: {
			fontSize: theme.font.xs,
			fontWeight: '500',
			color,
			flex: 1,
		},
	})

	return (
		<View style={styles.container}>
			<MaterialIcons name={variantIcon[variant]} size={14} color={color} />
			<Text style={styles.text}>{text}</Text>
		</View>
	)
}
