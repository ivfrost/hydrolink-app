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
				paddingVertical: theme.space.xl,
				gap: theme.space.md,
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
						<Text
							style={{
								fontSize: theme.font.base,
								fontWeight: titleFontWeight,
								color: disabled
									? theme.colors.buttonDisabledText
									: (titleColor ?? theme.colors.textPrimary),
								lineHeight: theme.lineHeight.cardTextTitle,
							}}
							numberOfLines={1}
						>
							{title}
						</Text>
						{subtitle && (
							<Text
								style={{
									fontSize: theme.font.sm,
									fontWeight: '400',
									color: theme.colors.textSecondary,
									lineHeight: theme.lineHeight.cardTextSubtitle,
								}}
								numberOfLines={1}
							>
								{subtitle}
							</Text>
						)}
					</View>

					{rightElement && (
						<View
							style={{
								alignItems: 'center',
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
