import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import HeadingIcon from './HeadingIcon'

export interface CardItemProps {
	title: string
	titleFontWeight?: '400' | '500' | '600' | '700'
	titleColor?: string
	subtitle?: string | React.ReactNode
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	iconSize?: number
	statusColor: string
	statusBg: string
	onPress?: () => void
	rightElement?: React.ReactNode
	bottomElement?: React.ReactNode
	disabled?: boolean
	compact?: boolean
	multiline?: boolean
	verticalPadding?: number
	hideTitle?: boolean
}

export default function CardItem({
	title,
	titleFontWeight = '600',
	titleColor,
	subtitle,
	icon,
	iconSize,
	statusColor,
	statusBg,
	onPress,
	rightElement,
	bottomElement,
	disabled = false,
	compact = false,
	multiline = false,
	verticalPadding,
	hideTitle = false,
}: CardItemProps) {
	const theme = useTheme()

	return (
		<TouchableOpacity
			onPress={onPress}
			disabled={!onPress || disabled}
			activeOpacity={!!onPress ? 0.9 : 1}
			style={{
				flex: 1,
				width: '100%',
				paddingVertical:
					verticalPadding ??
					(compact
						? theme.space.compactCardVerticalPadding
						: multiline
							? theme.space.multilineCardVerticalPadding
							: theme.space.cardVerticalPadding),
				gap: compact ? theme.space.sm : theme.space.lg,
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					gap: theme.space.md,
					alignItems: 'center',
				}}
			>
				{icon && (
					<HeadingIcon
						icon={icon}
						iconSize={iconSize ?? theme.space.iconSize}
						statusColor={statusColor}
						statusBg={statusBg}
					/>
				)}

				<View
					style={{
						flex: 1,
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<View style={{ flex: 1 }}>
						{!hideTitle && (
							<Text
								style={{
									fontSize: theme.font.base,
									fontWeight: titleFontWeight,
									color: disabled
										? theme.colors.buttonDisabledText
										: (titleColor ?? theme.colors.textPrimary),
									lineHeight: theme.lineHeight.cardTextTitle,
								}}
								numberOfLines={multiline ? 3 : 1}
							>
								{title}
							</Text>
						)}
						{subtitle &&
							(typeof subtitle === 'string' ? (
								<Text
									style={{
										fontSize: theme.font.sm,
										fontWeight: theme.fontWeight.regular,
										color: theme.colors.textSecondary,
										lineHeight: theme.lineHeight.cardTextSubtitle,
									}}
									numberOfLines={multiline ? 3 : 1}
								>
									{subtitle}
								</Text>
							) : (
								<View style={{ flexShrink: 1 }}>{subtitle}</View>
							))}
					</View>

					{rightElement && (
						<View
							style={{
								alignItems: 'flex-end',
								justifyContent: 'center',
								overflow: 'hidden',
								paddingLeft: theme.space.md,
							}}
						>
							{rightElement}
						</View>
					)}
				</View>
			</View>

			{bottomElement && <View style={{ width: '100%' }}>{bottomElement}</View>}
		</TouchableOpacity>
	)
}
