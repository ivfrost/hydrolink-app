import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import CardWrapper from '../layout/CardWrapper'
import DashboardRowItem from './DashboardRowItem'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { AreaAction } from '@/types/card'

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
	variant: 'active' | 'incoming'
	actions?: AreaAction[]
}

export default function AreaCard({
	areaData,
	variant,
	actions,
}: AreaCardProps) {
	const theme = useTheme()

	const accentColor =
		variant === 'active' ? theme.colors.online : theme.colors.warning
	const badgeBg =
		variant === 'active' ? theme.colors.onlineBg : theme.colors.warningBg

	const iconName: keyof typeof MaterialCommunityIcons.glyphMap =
		variant === 'active' ? 'valve' : 'valve-closed'

	const styles = StyleSheet.create({
		timeBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.xs,
			backgroundColor: badgeBg,
			paddingHorizontal: theme.space.sm,
			paddingVertical: theme.space.x2s,
			borderRadius: theme.radius.pill,
		},
		timeBadgeText: {
			fontSize: theme.font.xs,
			fontWeight: '600',
			color: accentColor,
		},
	})

	return (
		<CardWrapper flexDirection="column" elevation={0}>
			{areaData.map((area: AreaItem, idx: number) => {
				const station = area.activeStation
				if (!station) return null

				return (
					<DashboardRowItem
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
						renderRightElement={() => (
							<View style={styles.timeBadge}>
								{variant === 'active' ? (
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
								<Text style={styles.timeBadgeText}>
									{formatRelativeTime(station.time, variant)}
								</Text>
							</View>
						)}
					/>
				)
			})}
		</CardWrapper>
	)
}
