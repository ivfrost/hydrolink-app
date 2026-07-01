import { Text, View } from 'react-native'
import CardWrapper from '../layout/CardWrapper'
import CardItem from '../ui/CardItem'
import { useTheme } from '@/context/ThemeContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import DashboardHeader from './DashboardHeader'

export interface AreaSummaryCardProps {
	firstName?: string
	areaCount: number
	activeAreaCount: number
	onlineAreaCount: number
	alertCount?: number
}

export default function AreaSummaryCard({
	firstName,
	areaCount,
	activeAreaCount,
	onlineAreaCount,
	alertCount = 0,
}: AreaSummaryCardProps) {
	const theme = useTheme()

	const stats: {
		label: string
		value: number
		icon: keyof typeof MaterialCommunityIcons.glyphMap
		color: string
		bg: string
	}[] = [
		{
			label: 'Areas',
			value: areaCount,
			icon: 'map-marker-radius',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Online',
			value: onlineAreaCount,
			icon: 'access-point',
			color: theme.colors.online,
			bg: theme.colors.onlineBg,
		},
		{
			label: 'Active',
			value: activeAreaCount,
			icon: 'water-pump',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Alerts',
			value: alertCount,
			icon: 'bell-outline',
			color: theme.colors.textMuted,
			bg: theme.colors.background,
		},
	]

	return (
		<CardWrapper flexDirection="column" dividerDisabled elevation={0}>
			<DashboardHeader name={firstName} />
			<View style={{ flexDirection: 'row' }}>
				{stats.map((stat) => (
					<CardItem
						key={stat.label}
						extraStyles={{
							borderTopColor: theme.colors.accentBlueLight,
							borderTopWidth: 1,
						}}
					>
						<View
							style={{
								backgroundColor: stat.bg,
								width: theme.space.x3l,
								height: theme.space.x3l,
								borderRadius: theme.radius.fab,
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<MaterialCommunityIcons
								name={stat.icon}
								size={18}
								color={stat.color}
							/>
						</View>
						<Text
							style={{
								fontSize: theme.font.base,
								fontWeight: '700',
								marginBottom: -theme.space.sm,
							}}
						>
							{stat.value}
						</Text>
						<Text
							style={{
								color: theme.colors.textMuted,
							}}
						>
							{stat.label}
						</Text>
					</CardItem>
				))}
			</View>
		</CardWrapper>
	)
}
