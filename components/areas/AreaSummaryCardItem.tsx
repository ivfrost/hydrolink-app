import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

export interface AreaSummaryCardItemProps {
	solenoidCount: number
	pumpCount: number
	fertilizerCount: number
	sensorCount: number
}

export default function AreaSummaryCardItem({
	solenoidCount,
	pumpCount,
	fertilizerCount,
	sensorCount,
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
			icon: 'chemical-weapon',
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
	]

	return (
		<View style={{ flex: 1, flexDirection: 'row', gap: theme.space.md }}>
			{stats.map((stat) => (
				<View
					key={stat.label}
					style={{
						alignItems: 'center',
						gap: theme.space.sm,
						flex: 1,
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
					<View>
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
