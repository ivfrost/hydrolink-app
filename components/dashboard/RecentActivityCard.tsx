import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { RecentActivityEvent } from '@/types/card'
import { formatRelativeFromEpochStr } from '@/utils/formatRelativeTime'

import Card from '../layout/Card'
import CardItem from '../ui/CardItem'

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
		<Card flexDirection="column" elevation={0}>
			{events.map((event) => {
				const { color, bg } = getStatusColors(event.status)
				return (
					<CardItem
						key={event.id}
						title={event.title}
						subtitle={event.description}
						icon={event.icon}
						statusColor={color}
						statusBg={bg}
						rightElement={
							<Text
								style={{
									fontSize: theme.font.xs,
									color: theme.colors.textMuted,
									fontWeight: '500',
								}}
							>
								{formatRelativeFromEpochStr(event.time)}
							</Text>
						}
					/>
				)
			})}
		</Card>
	)
}
