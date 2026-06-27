import { useTheme } from '@/theme'
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
} from 'react-native'
import * as Haptics from 'expo-haptics'

export interface HydroButtonProps {
	label: string
	variant?: 'primary' | 'secondary' | 'tertiary'
	modifier?: ('tall' | 'full')[]
	loading?: boolean
	icon?: React.ReactNode
	iconPosition?: 'left' | 'right'
	onPress?: () => any
}

export default function HydroButton({
	label,
	variant = 'primary',
	modifier,
	loading = false,
	icon,
	iconPosition = 'left',
	onPress,
}: HydroButtonProps) {
	const isTall = modifier?.includes('tall') ?? false
	const isFull = modifier?.includes('full') ?? false
	const theme = useTheme()
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		if (onPress) onPress()
	}

	const styles = StyleSheet.create({
		button: {
			borderRadius: theme.buttonBorderRadius,
			paddingVertical: isTall ? 22 : 14,
			paddingHorizontal: 20,
			alignItems: 'center',
			justifyContent: 'center',
			width: isFull ? '100%' : undefined,
			backgroundColor:
				variant === 'primary'
					? theme.buttonPrimaryBg
					: variant === 'secondary'
						? theme.buttonSecondaryBg
						: 'transparent',
		},
		buttonWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 10 },
		buttonText: {
			fontSize: theme.fontBase,
			fontWeight: '500',
			textAlign: 'center',
			color:
				variant === 'primary'
					? theme.buttonPrimaryText
					: variant === 'secondary'
						? theme.buttonSecondaryText
						: theme.buttonTertiaryText,
		},
	})
	return (
		<TouchableOpacity
			style={[styles.button, icon ? styles.buttonWithIcon : null]}
			onPress={handlePress}
			activeOpacity={0.9}
		>
			{iconPosition === 'left' && icon ? (
				loading ? (
					<ActivityIndicator color={theme.buttonPrimaryText} size="small" />
				) : (
					icon
				)
			) : null}
			<Text style={styles.buttonText}>{label}</Text>
			{iconPosition === 'right' && icon ? (
				loading ? (
					<ActivityIndicator color={theme.buttonPrimaryText} size="small" />
				) : (
					icon
				)
			) : null}
		</TouchableOpacity>
	)
}
