import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface AreaSummaryCardItemProps {
	solenoidCount: number
	pumpCount: number
	fertilizerCount: number
	sensorCount: number
	unclassifiedCount: number
}

export default function AreaSummaryCardItem({
	solenoidCount,
	pumpCount,
	fertilizerCount,
	sensorCount,
	unclassifiedCount,
}: AreaSummaryCardItemProps) {
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
			value: solenoidCount + pumpCount + fertilizerCount + sensorCount,
			icon: 'chart-box',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Solenoids',
			value: solenoidCount,
			icon: 'valve',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Pumps',
			value: pumpCount,
			icon: 'water-pump',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Fertilizers',
			value: fertilizerCount,
			icon: 'sprout',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Sensors',
			value: sensorCount,
			icon: 'thermometer-lines',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
		{
			label: 'Unclassified',
			value: unclassifiedCount,
			icon: 'help-circle',
			color: theme.colors.accentBlue,
			bg: theme.colors.accentBlueLight,
		},
	]

	return (
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
							borderRadius: theme.radius.fab,
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
	)
}
