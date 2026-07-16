import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import HeadingIcon from './HeadingIcon'

export interface CardItemProps {
	title: string
	titleFontWeight?: '400' | '500' | '600' | '700'
	titleColor?: string
	subtitle?: string
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	statusColor: string
	statusBg: string
	onPress?: () => void
	rightElement?: React.ReactNode
	bottomElement?: React.ReactNode
}

export default function CardItem({
	title,
	titleFontWeight = '600',
	titleColor,
	subtitle,
	icon,
	statusColor,
	statusBg,
	onPress,
	rightElement,
	bottomElement,
}: CardItemProps) {
	const theme = useTheme()

	const ContainerElement = onPress ? TouchableOpacity : View
	const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {}

	return (
		<ContainerElement
			{...containerProps}
			style={{
				flex: 1,
				width: '100%',
				paddingVertical: theme.space.xl,
				backgroundColor: theme.colors.card,
				gap: theme.space.lg,
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					gap: theme.space.lg,
					alignItems: 'center',
				}}
			>
				{/* Heading Icon */}
				{icon && (
					<HeadingIcon
						icon={icon}
						statusColor={statusColor}
						statusBg={statusBg}
					/>
				)}

				{/* Content Body */}
				<View
					style={{
						flex: 1,
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<View style={{ flex: 1, gap: theme.space.x2s }}>
						<Text
							style={{
								fontSize: theme.font.base,
								fontWeight: titleFontWeight,
								color: titleColor ?? theme.colors.textPrimary,
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

					{/* Right Slot */}
					{rightElement && (
						<View
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								overflow: 'hidden',
							}}
						>
							{rightElement}
						</View>
					)}
				</View>
			</View>

			{/* Bottom Slot */}
			{bottomElement && <View style={{ width: '100%' }}>{bottomElement}</View>}
		</ContainerElement>
	)
}
