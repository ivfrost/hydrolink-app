import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface CompoundListItemProps {
	title: string
	subtitle: string
	icon: keyof typeof MaterialCommunityIcons.glyphMap
	statusColor: string
	statusBg: string
	onPress?: () => void
	renderRightElement?: () => React.ReactNode
	renderBottomElement?: () => React.ReactNode
}

export default function CompoundListItem({
	title,
	subtitle,
	icon,
	statusColor,
	statusBg,
	onPress,
	renderRightElement,
	renderBottomElement,
}: CompoundListItemProps) {
	const theme = useTheme()

	const ContainerElement = onPress ? TouchableOpacity : View
	const containerProps = onPress ? { onPress, activeOpacity: 0.9 } : {}

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			gap: theme.space.lg,
			alignItems: 'center',
			flex: 1,
		},
		iconBackdrop: {
			width: theme.space.x3l,
			height: theme.space.x3l,
			borderRadius: theme.radius.fab,
			backgroundColor: statusBg,
			justifyContent: 'center',
			alignItems: 'center',
		},
		contentWrapper: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'flex-start',
		},
		textStack: {
			flex: 1,
			gap: 2,
		},
		titleText: {
			fontSize: theme.font.sm,
			fontWeight: '600',
			color: theme.colors.textPrimary,
		},
		subtitleText: {
			fontSize: theme.font.xs,
			fontWeight: '400',
			color: theme.colors.textSecondary,
		},
		rightElementContainer: {
			alignItems: 'flex-end',
			justifyContent: 'center',
		},
	})

	return (
		<ContainerElement {...containerProps}>
			<View style={styles.container}>
				<View style={styles.iconBackdrop}>
					<MaterialCommunityIcons name={icon} size={20} color={statusColor} />
				</View>

				<View style={styles.contentWrapper}>
					<View style={styles.textStack}>
						<Text style={styles.titleText} numberOfLines={1}>
							{title}
						</Text>
						<Text style={styles.subtitleText} numberOfLines={1}>
							{subtitle}
						</Text>
					</View>

					{renderRightElement && (
						<View style={styles.rightElementContainer}>
							{renderRightElement()}
						</View>
					)}
				</View>
			</View>
			{renderBottomElement && (
				<View style={{ marginTop: theme.space.sm }}>
					{renderBottomElement()}
				</View>
			)}
		</ContainerElement>
	)
}
