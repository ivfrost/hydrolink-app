import {
	ActivityIndicator,
	StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
	ViewStyle,
} from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

import { useTheme } from '@/context/ThemeContext'

export interface ButtonProps extends TouchableOpacityProps {
	ref?: React.Ref<View>
	label?: string
	variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
	modifier?: (
		| 'tall'
		| 'full'
		| 'fab'
		| 'iconOnly'
		| 'small'
		| 'outlined'
		| 'overImage'
	)[]
	icon?:
		| React.ReactNode
		| keyof typeof MaterialCommunityIcons
		| keyof typeof MaterialIcons
	iconColor?: string
	iconSize?: number
	loading?: boolean
	disabled?: boolean
	onPress?: () => void
	iconPosition?: 'left' | 'right'
	extraStyles?: StyleProp<ViewStyle>
	hapticFeedback?: boolean
}

export default function Button({
	ref,
	label,
	variant = 'primary',
	modifier,
	loading = false,
	icon,
	iconColor,
	iconSize,
	disabled = false,
	iconPosition = 'left',
	extraStyles,
	onPress,
	hapticFeedback = true,
}: ButtonProps) {
	const isTall = modifier?.includes('tall') ?? false
	const isFull = modifier?.includes('full') ?? false
	const isIconOnly = modifier?.includes('iconOnly') ?? false
	const isFab = modifier?.includes('fab') ?? false
	const isFabOrIconOnly = isFab || isIconOnly
	const isSmall = modifier?.includes('small') ?? false
	const isOverImage = modifier?.includes('overImage') ?? false
	const theme = useTheme()
	const handlePress = () => {
		if (disabled || loading) return

		hapticFeedback && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		onPress?.()
	}

	const styles = StyleSheet.create({
		button: {
			borderRadius: isFabOrIconOnly ? theme.radius.fab : theme.radius.button,
			paddingVertical: isFabOrIconOnly
				? 0
				: isSmall
					? 0
					: isTall
						? theme.space.tallButtonVerticalPadding
						: theme.space.buttonVerticalPadding,
			paddingHorizontal: isFabOrIconOnly
				? 0
				: isSmall
					? 0
					: isTall
						? theme.space.tallButtonHorizontalPadding
						: theme.space.buttonHorizontalPadding,
			paddingLeft: isFabOrIconOnly
				? 0
				: icon && iconPosition === 'left'
					? isSmall
						? theme.space.smallButtonHorizontalPadding
						: theme.space.lg
					: theme.space.buttonHorizontalPadding,
			paddingRight: isFabOrIconOnly
				? 0
				: icon && iconPosition === 'right'
					? theme.space.lg
					: isSmall
						? theme.space.smallButtonHorizontalPadding
						: theme.space.buttonHorizontalPadding,
			alignItems: 'center',
			justifyContent: 'center',
			minWidth: isFab
				? theme.space.fabButtonSize
				: isTall
					? theme.space.tallButtonSize
					: isSmall
						? theme.space.smallButtonSize
						: isFull
							? '100%'
							: 'auto',
			width: isFab ? theme.space.fabButtonSize : 'auto',

			height: isFab
				? theme.space.fabButtonSize
				: isTall
					? theme.space.tallButtonSize
					: theme.space.buttonSize,
			backgroundColor: isOverImage
				? theme.colors.textBoxBackground
				: disabled || loading
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
			...(isIconOnly && {
				width: theme.space.iconOnlyButtonSize,
				height: theme.space.iconOnlyButtonSize,
			}),
			...(isSmall && {
				paddingVertical: theme.space.smallButtonVerticalPadding,
				paddingHorizontal: theme.space.smallButtonHorizontalPadding,
				width: 'auto',
				height: theme.space.smallButtonSize,
			}),
			borderWidth:
				variant === 'tertiary' && modifier?.includes('outlined') ? 1 : 0,
			borderColor:
				variant === 'tertiary' && modifier?.includes('outlined')
					? theme.colors.border
					: 'transparent',
		},
		buttonWithIcon: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: isSmall ? theme.space.xs : theme.space.sm,
		},
		buttonText: {
			fontSize: isSmall ? theme.font.sm : theme.font.base,
			fontWeight: '500',
			textAlign: 'center',
			flexShrink: 1,
			color:
				disabled || loading
					? theme.colors.buttonDisabledText
					: variant === 'primary'
						? theme.colors.buttonPrimaryText
						: variant === 'secondary'
							? theme.colors.buttonSecondaryText
							: variant === 'tertiary'
								? theme.colors.textSecondary
								: variant === 'destructive'
									? theme.colors.buttonPrimaryText
									: theme.colors.buttonPrimaryText,
		},
	})
	return (
		<TouchableOpacity
			ref={ref}
			style={[styles.button, icon ? styles.buttonWithIcon : null, extraStyles]}
			onPress={handlePress}
			disabled={disabled}
			activeOpacity={0.9}
			hitSlop={20}
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
				) : typeof icon === 'string' &&
				  icon in MaterialCommunityIcons.glyphMap ? (
					<MaterialCommunityIcons
						name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
						size={iconSize || theme.space.iconSize}
						color={iconColor || theme.colors.textPrimary}
					/>
				) : typeof icon === 'string' && icon in MaterialIcons.glyphMap ? (
					<MaterialIcons
						name={icon as keyof typeof MaterialIcons.glyphMap}
						size={isSmall ? theme.space.iconSizeSm : theme.space.iconSize}
						color={iconColor || theme.colors.textPrimary}
					/>
				) : (
					// fallback if icon is already a ReactNode
					(icon as React.ReactNode)
				)
			) : null}
			{!isFabOrIconOnly && label ? (
				<Text style={styles.buttonText}>{label}</Text>
			) : null}
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
