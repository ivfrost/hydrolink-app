import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { formatRelativeFromEpochStr } from '@/utils/formatRelativeTime'

import Card from '../layout/Card'
import Subtext from '../ui/Subtext'

export interface AreaSummaryCardProps {
	solenoidCount: number
	fertilizerCount: number
	sensorCount: number
	unclassifiedCount: number
	lastUpdatedStr: string
}

export default function AreaSummaryCard({
	solenoidCount,
	fertilizerCount,
	sensorCount,
	unclassifiedCount,
	lastUpdatedStr,
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
			label: 'Total',
			value: solenoidCount + fertilizerCount + sensorCount + unclassifiedCount,
			icon: 'chart-box',
			color: theme.colors.accent,
			bg: theme.colors.accentTint,
		},
		{
			label: 'Solenoids',
			value: solenoidCount,
			icon: 'valve',
			color: theme.colors.accent,
			bg: theme.colors.accentTint,
		},
		{
			label: 'Fertilizers',
			value: fertilizerCount,
			icon: 'sprout',
			color: theme.colors.accent,
			bg: theme.colors.accentTint,
		},
		{
			label: 'Sensors',
			value: sensorCount,
			icon: 'thermometer-lines',
			color: theme.colors.accent,
			bg: theme.colors.accentTint,
		},
		{
			label: 'Unclassified',
			value: unclassifiedCount,
			icon: 'help-circle',
			color: theme.colors.accent,
			bg: theme.colors.accentTint,
		},
	]

	return (
		<>
			<Card flexDirection="column" elevation={0}>
				<View
					style={{
						flexDirection: 'row',
						flexWrap: 'wrap',
						gap: theme.space.xl,
						paddingVertical: theme.space.xl,
						paddingHorizontal: theme.space.xl,
						justifyContent: 'flex-start',
						width: '100%',
					}}
				>
					{stats.map((stat) => (
						<View
							key={stat.label}
							style={{
								alignItems: 'center',
								flexDirection: 'row',
								flexBasis: '45%',
								paddingVertical: theme.space.x2s,
								gap: theme.space.sm,
							}}
						>
							<View
								style={{
									width: theme.space.x3l,
									height: theme.space.x3l,
									borderRadius: theme.radius.headingIcon,
									backgroundColor: stat.bg,
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
							<View
								style={{
									alignItems: 'center',
									gap: theme.space.x2s,
									flexDirection: 'row',
								}}
							>
								<Text
									style={{
										color: theme.colors.textPrimary,
										fontSize: theme.font.base,
										fontWeight: '500',
									}}
								>
									{stat.value}
								</Text>
								<Text
									style={{
										color: theme.colors.textMuted,
										fontSize: theme.font.sm,
									}}
								>
									{stat.label}
								</Text>
							</View>
						</View>
					))}
				</View>
			</Card>
			<Subtext
				text={`Last updated ${formatRelativeFromEpochStr(lastUpdatedStr)}`}
			/>
		</>
	)
}
