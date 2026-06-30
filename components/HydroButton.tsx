import { useTheme } from '@/context/ThemeContext'
import {
	ActivityIndicator,
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'

export interface HydroButtonProps {
	label: string
	variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
	modifier?: ('tall' | 'full' | 'fab')[]
	loading?: boolean
	disabled?: boolean
	icon?: React.ReactNode
	iconPosition?: 'left' | 'right'
	extraStyles?: StyleProp<ViewStyle>
	onPress?: () => any
}

export default function HydroButton({
	label,
	variant = 'primary',
	modifier,
	loading = false,
	icon,
	disabled = false,
	iconPosition = 'left',
	extraStyles,
	onPress,
}: HydroButtonProps) {
	const isTall = modifier?.includes('tall') ?? false
	const isFull = modifier?.includes('full') ?? false
	const isFab = modifier?.includes('fab') ?? false
	const theme = useTheme()
	const handlePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		if (onPress) onPress()
	}
	const styles = StyleSheet.create({
		button: {
			borderRadius: isFab ? theme.radius.fab : theme.radius.button,
			paddingVertical: isFab ? 0 : isTall ? theme.space.xl : theme.space.lg,
			paddingHorizontal: isFab ? 0 : theme.space.xl,
			alignItems: 'center',
			justifyContent: 'center',
			width: isFab ? 60 : isFull ? '100%' : 'auto',
			height: isFab ? 60 : undefined,
			backgroundColor:
				variant === 'primary'
					? theme.colors.buttonPrimaryBg
					: variant === 'secondary'
						? theme.colors.buttonSecondaryBg
						: variant === 'tertiary'
							? 'transparent'
							: variant === 'destructive'
								? theme.colors.buttonDestructiveBg
								: theme.colors.buttonPrimaryBg,
			...(isFab && {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
				elevation: 6,
			}),
		},
		buttonWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 10 },
		buttonText: {
			fontSize: theme.font.base,
			fontWeight: '500',
			textAlign: 'center',
			color:
				disabled || loading
					? theme.colors.buttonDisabledText
					: variant === 'primary'
						? theme.colors.buttonPrimaryText
						: variant === 'secondary'
							? theme.colors.buttonSecondaryText
							: variant === 'tertiary'
								? theme.colors.textMuted
								: variant === 'destructive'
									? theme.colors.buttonPrimaryText
									: theme.colors.buttonPrimaryText,
		},
	})
	return (
		<TouchableOpacity
			style={[styles.button, icon ? styles.buttonWithIcon : null, extraStyles]}
			onPress={handlePress}
			disabled={disabled}
			activeOpacity={0.9}
		>
			{iconPosition === 'left' && icon ? (
				loading ? (
					<ActivityIndicator
						color={
							variant === 'primary' || variant === 'destructive'
								? theme.colors.buttonDisabledText
								: theme.colors.buttonSecondaryText
						}
						size="small"
					/>
				) : (
					icon
				)
			) : null}
			{label ? <Text style={styles.buttonText}>{label}</Text> : null}
			{iconPosition === 'right' && icon ? (
				loading ? (
					<ActivityIndicator
						color={
							variant === 'primary' || variant === 'destructive'
								? theme.colors.buttonDisabledText
								: theme.colors.buttonSecondaryText
						}
						size="small"
					/>
				) : (
					icon
				)
			) : null}
		</TouchableOpacity>
	)
}
