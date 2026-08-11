import {
	ActivityIndicator,
	Pressable,
	StyleProp,
	StyleSheet,
	Text,
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
	modifier?: ('tall' | 'full' | 'fab' | 'iconOnly' | 'small' | 'outlined')[]
	icon?:
		| React.ReactNode
		| keyof typeof MaterialCommunityIcons
		| keyof typeof MaterialIcons
	iconColor?: string
	iconSize?: number
	outlineColor?: string
	outlineWidth?: number
	loading?: boolean
	disabled?: boolean
	onPress?: () => void
	isSubmenuOpen?: boolean
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
	outlineColor,
	outlineWidth,
	disabled = false,
	iconPosition = 'left',
	extraStyles,
	onPress,
	isSubmenuOpen = false,
	hapticFeedback = true,
}: ButtonProps) {
	const theme = useTheme()

	const isTall = modifier?.includes('tall') ?? false
	const isFull = modifier?.includes('full') ?? false
	const isIconOnly = modifier?.includes('iconOnly') ?? false
	const isFab = modifier?.includes('fab') ?? false
	const isSmall = modifier?.includes('small') ?? false
	const isOutlined = modifier?.includes('outlined') ?? false

	const isMuted = disabled || loading

	const handlePress = () => {
		if (isMuted) return
		hapticFeedback && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
		onPress?.()
	}

	// --- Color lookups: single source of truth per variant ---
	const bgColorByVariant = {
		primary: {
			base: theme.colors.buttonPrimary,
			pressed: theme.colors.buttonPrimaryPressed,
		},
		secondary: {
			base: theme.colors.buttonSecondary,
			pressed: theme.colors.buttonSecondaryPressed,
		},
		tertiary: {
			base: 'transparent',
			pressed: theme.colors.buttonTertiaryPressed,
		},
		destructive: {
			base: theme.colors.buttonDestructive,
			pressed: theme.colors.buttonDestructivePressed,
		},
	} as const

	const textColorByVariant = {
		primary: theme.colors.buttonPrimaryText,
		secondary: theme.colors.buttonSecondaryText,
		tertiary: theme.colors.textSecondary,
		destructive: theme.colors.buttonPrimaryText,
	} as const

	const sizeConfig = (() => {
		if (isFab) {
			const size = isSmall
				? theme.space.smallButtonSize
				: theme.space.fabButtonSize
			return {
				width: size,
				height: size,
				paddingVertical: 0,
				paddingHorizontal: 0,
				iconSize: isSmall ? theme.space.iconSizeSm : theme.space.iconSize,
			}
		}

		if (isIconOnly) {
			const size = isSmall
				? theme.space.smallButtonSize
				: theme.space.iconOnlyButtonSize
			return {
				width: size,
				height: size,
				paddingVertical: 0,
				paddingHorizontal: 0,
				iconSize: isSmall ? theme.space.iconSizeSm : theme.space.iconSize,
			}
		}

		if (isSmall) {
			return {
				width: isFull ? ('100%' as const) : ('auto' as const),
				height: theme.space.smallButtonSize,
				paddingVertical: theme.space.smallButtonVerticalPadding,
				paddingHorizontal: theme.space.smallButtonHorizontalPadding,
				iconSize: theme.space.iconSize,
			}
		}

		if (isTall) {
			return {
				width: isFull ? ('100%' as const) : ('auto' as const),
				height: theme.space.tallButtonSize,
				paddingVertical: theme.space.tallButtonVerticalPadding,
				paddingHorizontal: theme.space.tallButtonHorizontalPadding,
				iconSize: theme.space.iconSize,
			}
		}

		return {
			width: isFull ? ('100%' as const) : ('auto' as const),
			height: theme.space.buttonSize,
			paddingVertical: theme.space.buttonVerticalPadding,
			paddingHorizontal: theme.space.buttonHorizontalPadding,
			iconSize: theme.space.iconSize,
		}
	})()

	const baseStyles = StyleSheet.create({
		button: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: isSmall ? theme.space.xs : theme.space.sm,
			borderRadius: isFab
				? theme.radius.fab
				: isIconOnly
					? theme.radius.headingIcon
					: theme.radius.button,
			borderWidth:
				variant === 'tertiary' && isOutlined ? (outlineWidth ?? 1) : 0,
			borderColor:
				variant === 'tertiary' && isOutlined
					? (outlineColor ?? theme.colors.border)
					: 'transparent',
			...(isFab && {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 4,
				elevation: 6,
			}),
		},
		text: {
			fontSize: isSmall ? theme.font.sm : theme.font.base,
			fontWeight: '500',
			textAlign: 'center',
			flexShrink: 1,
			color: isMuted
				? theme.colors.buttonDisabledText
				: textColorByVariant[variant],
		},
	})

	const resolveIcon = () => {
		if (loading) {
			return (
				<ActivityIndicator
					color={
						variant === 'primary' || variant === 'destructive'
							? theme.colors.buttonDisabledText
							: theme.colors.buttonSecondaryText
					}
					size="small"
				/>
			)
		}

		if (typeof icon === 'string') {
			const resolvedSize = iconSize || sizeConfig.iconSize
			const resolvedColor = isMuted
				? theme.colors.buttonDisabledText
				: iconColor || textColorByVariant[variant]

			if (icon in MaterialCommunityIcons.glyphMap) {
				return (
					<MaterialCommunityIcons
						name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
						size={resolvedSize}
						color={resolvedColor}
					/>
				)
			}

			if (icon in MaterialIcons.glyphMap) {
				return (
					<MaterialIcons
						name={icon as keyof typeof MaterialIcons.glyphMap}
						size={resolvedSize}
						color={resolvedColor}
					/>
				)
			}
		}

		return icon as React.ReactNode
	}

	return (
		<Pressable
			ref={ref}
			onPress={handlePress}
			disabled={disabled}
			hitSlop={20}
			style={({ pressed }) => {
				const isPressed = pressed && !isMuted

				const bgColor = isMuted
					? variant === 'tertiary'
						? 'transparent'
						: theme.colors.buttonDisabled
					: isPressed || isSubmenuOpen
						? bgColorByVariant[variant].pressed
						: bgColorByVariant[variant].base

				return [
					baseStyles.button,
					extraStyles,
					{
						width: sizeConfig.width,
						height: sizeConfig.height,
						paddingVertical: sizeConfig.paddingVertical,
						paddingHorizontal: sizeConfig.paddingHorizontal,
						transform: [{ scale: isPressed ? 0.97 : 1 }],
						backgroundColor: bgColor,
					},
				]
			}}
		>
			{iconPosition === 'left' && icon && resolveIcon()}
			{!isIconOnly && !isFab && label && (
				<Text style={baseStyles.text}>{label}</Text>
			)}
			{iconPosition === 'right' && icon && resolveIcon()}
		</Pressable>
	)
}
