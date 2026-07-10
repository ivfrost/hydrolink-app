import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { AreaAction } from '@/types/card'
import {
	formatRelativeTime,
	isRelativeTimeInFuture,
} from '@/utils/formatRelativeTime'

import Card from '../layout/Card'
import CardItem from '../ui/CardItem'

export interface ActiveStation {
	name: string
	time: string
}

export interface AreaItem {
	name: string
	activeStation: ActiveStation
}
export interface AreaCardProps {
	areaData: AreaItem[]
	actions?: AreaAction[]
}

export default function AreaCard({ areaData, actions }: AreaCardProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		timeBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.xs,
			paddingHorizontal: theme.space.sm,
			paddingVertical: theme.space.x2s,
			borderRadius: theme.radius.pill,
		},
		timeBadgeText: {
			fontSize: theme.font.xs,
			fontWeight: '600',
		},
	})

	return (
		<Card flexDirection="column" elevation={0}>
			{areaData.map((area: AreaItem, idx: number) => {
				const station = area.activeStation
				const incoming = isRelativeTimeInFuture(station.time)
				const accentColor = !incoming
					? theme.colors.online
					: theme.colors.warning
				const badgeBg = !incoming
					? theme.colors.onlineBg
					: theme.colors.warningBg

				const iconName: keyof typeof MaterialCommunityIcons.glyphMap = !incoming
					? 'valve'
					: 'valve-closed'

				if (!station) return null

				return (
					<CardItem
						key={idx}
						title={station.name}
						subtitle={area.name}
						icon={iconName}
						statusColor={accentColor}
						statusBg={badgeBg}
						onPress={
							actions && actions.length > 0
								? () => actions[0].onPress(idx)
								: undefined
						}
						rightElement={
							<View style={[styles.timeBadge, { backgroundColor: badgeBg }]}>
								{!incoming ? (
									<View
										style={{
											width: 6,
											height: 6,
											borderRadius: 3,
											backgroundColor: accentColor,
										}}
									/>
								) : (
									<MaterialCommunityIcons
										name="clock-outline"
										size={12}
										color={accentColor}
									/>
								)}
								<Text style={[styles.timeBadgeText, { color: accentColor }]}>
									{formatRelativeTime(station.time)}
								</Text>
							</View>
						}
					/>
				)
			})}
		</Card>
	)
}
