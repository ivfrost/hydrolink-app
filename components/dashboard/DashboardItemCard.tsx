import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import CardWrapper from '../layout/CardWrapper'
import CardItem from '../ui/CardItem'

export type DashboardItemStatus =
	| 'online'
	| 'warning'
	| 'fault'
	| 'offline'
	| 'scheduled'

export interface DashboardItem {
	id: string
	title: string
	subtitle: string
	time: string
	status: DashboardItemStatus
	icon: keyof typeof MaterialCommunityIcons.glyphMap
}

export interface DashboardItemCardProps {
	items: DashboardItem[]
}

function formatRelativeTime(iso: string) {
	const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

	if (diffMinutes < 0) {
		const absMinutes = Math.abs(diffMinutes)
		if (absMinutes < 60) return `in ${absMinutes}m`
		const absHours = Math.floor(absMinutes / 60)
		return `in ${absHours}h ${absMinutes % 60}m`
	}

	if (diffMinutes < 1) return 'just now'
	if (diffMinutes < 60) return `${diffMinutes}m ago`
	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m ago`
	const diffDays = Math.floor(diffHours / 24)
	return `${diffDays}d ago`
}

export default function DashboardItemCard({ items }: DashboardItemCardProps) {
	const theme = useTheme()

	const statusStyle = (status: DashboardItemStatus) => {
		switch (status) {
			case 'online':
				return { color: theme.colors.online, bg: theme.colors.onlineBg }
			case 'warning':
				return { color: theme.colors.warning, bg: theme.colors.warningBg }
			case 'fault':
				return { color: theme.colors.fault, bg: theme.colors.faultBg }
			case 'scheduled':
				return { color: theme.colors.scheduled, bg: theme.colors.scheduledBg }
			default:
				return {
					color: theme.colors.textMuted,
					bg: theme.colors.buttonSecondaryBg,
				}
		}
	}

	return (
		<CardWrapper flexDirection="column" elevation={0}>
			{items.map((item) => {
				const { color, bg } = statusStyle(item.status)
				return (
					<CardItem key={item.id} flexDirection="row">
						<View
							style={{
								flexDirection: 'row',
								gap: theme.space.lg,
								alignItems: 'center',
								flex: 1,
							}}
						>
							{/* Left-side status circle backdrop*/}
							<View
								style={{
									width: theme.space.x3l,
									height: theme.space.x3l,
									borderRadius: theme.radius.fab,
									backgroundColor: bg,
									justifyContent: 'center',
									alignItems: 'center',
								}}
							>
								<MaterialCommunityIcons
									name={item.icon}
									size={20}
									color={color}
								/>
							</View>

							{/* Core descriptive text layout blocks */}
							<View style={{ flex: 1, gap: 2 }}>
								<View
									style={{
										flexDirection: 'row',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Text
										style={{
											fontSize: theme.font.sm,
											fontWeight: '600',
											color: theme.colors.textPrimary,
										}}
										numberOfLines={1}
									>
										{item.title}
									</Text>

									<Text
										style={{
											fontSize: theme.font.xs,
											fontWeight: '500',
											color: color,
										}}
									>
										{formatRelativeTime(item.time)}
									</Text>
								</View>

								<Text
									style={{
										fontSize: theme.font.xs,
										color: theme.colors.textSecondary,
									}}
									numberOfLines={1}
								>
									{item.subtitle}
								</Text>
							</View>
						</View>
					</CardItem>
				)
			})}
		</CardWrapper>
	)
}
