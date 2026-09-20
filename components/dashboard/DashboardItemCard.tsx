import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

import Card from '../layout/Card'
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
	const replace = (template: string, values: Record<string, number>) =>
		template.replace(/\{(\w+)\}/g, (_, key: string) =>
			String(values[key] ?? `{${key}}`),
		)
	const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

	if (diffMinutes < 0) {
		const absMinutes = Math.abs(diffMinutes)
		if (absMinutes < 60)
			return replace(t('dashboard.inMinutes'), { value: absMinutes })
		const absHours = Math.floor(absMinutes / 60)
		return replace(t('dashboard.inHours'), {
			hours: absHours,
			minutes: absMinutes % 60,
		})
	}

	if (diffMinutes < 1) return t('dashboard.justNow')
	if (diffMinutes < 60)
		return replace(t('dashboard.minutesAgo'), { value: diffMinutes })
	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24)
		return replace(t('dashboard.hoursAgo'), {
			hours: diffHours,
			minutes: diffMinutes % 60,
		})
	const diffDays = Math.floor(diffHours / 24)
	return replace(t('dashboard.daysAgo'), { value: diffDays })
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
					bg: theme.colors.buttonSecondary,
				}
		}
	}

	return (
		<Card flexDirection="column" elevation={0}>
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
							<View style={{ flex: 1, gap: theme.space.x3s }}>
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
											fontWeight: theme.fontWeight.semibold,
											color: theme.colors.textPrimary,
										}}
										numberOfLines={1}
									>
										{item.title}
									</Text>

									<Text
										style={{
											fontSize: theme.font.xs,
											fontWeight: theme.fontWeight.medium,
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
		</Card>
	)
}
