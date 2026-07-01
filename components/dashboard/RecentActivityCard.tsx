import React from 'react'
import { Text } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import CardWrapper from '../layout/CardWrapper'
import DashboardRowItem from './DashboardRowItem'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { RecentActivityEvent } from '@/types/card'

export interface RecentActivityCardProps {
	events: RecentActivityEvent[]
}

export default function RecentActivityCard({
	events,
}: RecentActivityCardProps) {
	const theme = useTheme()

	const getStatusColors = (status: RecentActivityEvent['status']) => {
		switch (status) {
			case 'success':
				return { color: theme.colors.online, bg: theme.colors.onlineBg }
			case 'warning':
				return { color: theme.colors.warning, bg: theme.colors.warningBg }
			case 'fault':
				return { color: theme.colors.fault, bg: theme.colors.faultBg }
			default:
				return {
					color: theme.colors.accentBlue,
					bg: theme.colors.accentBlueLight,
				}
		}
	}

	return (
		<CardWrapper flexDirection="column" elevation={0}>
			{events.map((event) => {
				const { color, bg } = getStatusColors(event.status)
				return (
					<DashboardRowItem
						key={event.id}
						title={event.title}
						subtitle={event.description}
						icon={event.icon}
						statusColor={color}
						statusBg={bg}
						renderRightElement={() => (
							<Text
								style={{
									fontSize: theme.font.xs,
									color: theme.colors.textMuted,
									fontWeight: '500',
								}}
							>
								{formatRelativeTime(event.time, 'active')}
							</Text>
						)}
					/>
				)
			})}
		</CardWrapper>
	)
}
