import {
	ActivityIndicator,
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	ViewStyle,
} from 'react-native'

import * as Haptics from 'expo-haptics'

import { useTheme } from '@/context/ThemeContext'

export interface ButtonProps {
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

export default function Button({
	label,
	variant = 'primary',
	modifier,
	loading = false,
	icon,
	disabled = false,
	iconPosition = 'left',
	extraStyles,
	onPress,
}: ButtonProps) {
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
			paddingVertical: isFab
				? 0
				: isTall
					? theme.space.tallButtonVerticalPadding
					: theme.space.buttonVerticalPadding,
			paddingHorizontal: isFab
				? 0
				: isTall
					? theme.space.tallButtonHorizontalPadding
					: theme.space.buttonHorizontalPadding,
			paddingLeft: isFab
				? 0
				: icon && iconPosition === 'left'
					? theme.space.lg
					: theme.space.buttonHorizontalPadding,
			paddingRight: isFab
				? 0
				: icon && iconPosition === 'right'
					? theme.space.lg
					: theme.space.buttonHorizontalPadding,
			alignItems: 'center',
			justifyContent: 'center',
			width: isFab ? theme.space.fabButtonSize : isFull ? '100%' : 'auto',
			height: isFab
				? theme.space.fabButtonSize
				: isTall
					? theme.space.tallButtonHeight
					: theme.space.buttonHeight,
			backgroundColor:
				disabled || loading
					? theme.colors.buttonDisabledBg
					: variant === 'primary'
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
								? theme.colors.textPrimary
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
