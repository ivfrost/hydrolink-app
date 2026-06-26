import { useTheme } from '@/theme'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

interface HydroButtonProps {
	label: string
	variant?: 'primary' | 'secondary'
	onPress?: () => void
}

export default function HydroButton({
	label,
	variant = 'primary',
	onPress,
}: HydroButtonProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		button: {
			borderRadius: 6,
			paddingVertical: 14,
			paddingHorizontal: 20,
			backgroundColor:
				variant === 'primary' ? theme.buttonPrimaryBg : theme.buttonSecondaryBg,
		},
		buttonText: {
			fontSize: theme.fontBase,
			fontWeight: '500',
			color:
				variant === 'primary'
					? theme.buttonPrimaryText
					: theme.buttonSecondaryText,
		},
	})
	return (
		<TouchableOpacity
			style={styles.button}
			onPress={onPress}
			activeOpacity={0.9}
		>
			<Text style={styles.buttonText}>{label}</Text>
		</TouchableOpacity>
	)
}
