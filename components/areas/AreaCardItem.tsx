import { Text, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import Badge from '@/components/ui/Badge'
import CardItem from '@/components/ui/CardItem'
import { useTheme } from '@/context/ThemeContext'
import { Station, StationSchedule } from '@/types/area'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

export interface AreaCardItemProps {
	title: string
	subtitle: string
	online: boolean
	activeSolenoid?: Station | undefined
	activePumps?: Station[] | undefined
	activeFertilizers?: Station[] | undefined
	sensors?: Station[] | undefined
	schedules?: StationSchedule[] | undefined
	onPress?: () => void
}

export default function AreaCardItem({
	title,
	subtitle,
	online,
	activeSolenoid,
	activePumps,
	activeFertilizers,
	sensors,
	schedules,
	onPress,
}: AreaCardItemProps) {
	const theme = useTheme()
	const currentSchedule = schedules?.[1]
	const pastSchedule = schedules?.[0]
	const futureSchedule = schedules?.[2]
	return (
		<CardItem
			title={title}
			subtitle={subtitle}
			icon={online ? 'map-marker-check' : 'map-marker-off'}
			statusColor={online ? theme.colors.online : theme.colors.fault}
			statusBg={online ? theme.colors.onlineBg : theme.colors.faultBg}
			onPress={onPress}
			rightElement={
				onPress && (
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.space.x2s,
							flex: 1,
						}}
					>
						<MaterialIcons
							name="chevron-right"
							size={24}
							color={theme.colors.textMuted}
						/>
					</View>
				)
			}
			bottomElement={
				activeSolenoid && (
					<>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: theme.space.md,
								borderRadius: theme.radius.boxInCard,
								backgroundColor: theme.colors.activeBg,
								padding: theme.space.lg,
							}}
						>
							<View style={{ flex: 1 }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
									}}
								>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: theme.space.sm,
										}}
									>
										<MaterialCommunityIcons
											name="valve-open"
											size={18}
											color={theme.colors.active}
										/>
										<Text
											numberOfLines={1}
											style={{
												color: theme.colors.active,
												fontSize: theme.font.base,
												fontWeight: '500',
											}}
										>
											{activeSolenoid.name}
										</Text>
									</View>
								</View>
								<Text
									style={{
										color: theme.colors.textSecondary,
										fontSize: theme.font.sm,
										fontWeight: '400',
										marginTop: 2,
									}}
								>
									{activeSolenoid.status.cause === 'Manual'
										? 'Manual Mode'
										: activeSolenoid.status.cause === 'Sensor'
											? 'Sensor Triggered'
											: activeSolenoid.status.cause === 'Schedule'
												? 'Scheduled'
												: 'Unknown Cause'}
									{activeSolenoid.schedules[1]?.start
										? ` • ${formatRelativeTime(activeSolenoid.schedules[1].start)}`
										: ' • Active Now'}
								</Text>
							</View>
						</View>
						{((activePumps && activePumps.length > 0) ||
							(activeFertilizers && activeFertilizers.length > 0)) && (
							<View
								style={{
									flexDirection: 'row',
									flexWrap: 'wrap',
									gap: theme.space.sm,
									marginTop: theme.space.md,
								}}
							>
								{activePumps?.map((pump) => (
									<Badge
										icon="water-pump"
										key={pump.id}
										text={pump.name}
										color={theme.colors.textSecondary}
										borderColor={theme.colors.accentBlueLight}
										backgroundColor={theme.colors.card}
									/>
								))}

								{activeFertilizers?.map((fertilizer) => (
									<Badge
										icon="sprout"
										key={fertilizer.id}
										text={fertilizer.name}
										color={theme.colors.textSecondary}
										borderColor={theme.colors.accentBlueLight}
										backgroundColor={theme.colors.card}
									/>
								))}
							</View>
						)}
						{pastSchedule && (
							<View
								style={{
									marginTop: theme.space.md,
									padding: theme.space.sm,
									backgroundColor: theme.colors.card,
									borderRadius: theme.radius.boxInCard,
								}}
							>
								<Text
									style={{
										color: theme.colors.textSecondary,
										fontSize: theme.font.sm,
										fontWeight: '400',
									}}
								>
									Last Schedule:{' '}
									{pastSchedule.start
										? `${formatRelativeTime(pastSchedule.start)} - ${formatRelativeTime(
												pastSchedule.end,
											)}`
										: 'Unknown'}
								</Text>
							</View>
						)}
						{currentSchedule && (
							<View
								style={{
									marginTop: theme.space.md,
									padding: theme.space.sm,
									backgroundColor: theme.colors.card,
									borderRadius: theme.radius.boxInCard,
								}}
							>
								<Text
									style={{
										color: theme.colors.textSecondary,
										fontSize: theme.font.sm,
										fontWeight: '400',
									}}
								>
									Current Schedule:{' '}
									{currentSchedule.start
										? `${formatRelativeTime(
												currentSchedule.start,
											)} - ${formatRelativeTime(currentSchedule.end)}`
										: 'Unknown'}
								</Text>
							</View>
						)}
						{futureSchedule && (
							<View
								style={{
									marginTop: theme.space.md,
									padding: theme.space.sm,
									backgroundColor: theme.colors.card,
									borderRadius: theme.radius.boxInCard,
								}}
							>
								<Text
									style={{
										color: theme.colors.textSecondary,
										fontSize: theme.font.sm,
										fontWeight: '400',
									}}
								>
									Next Schedule:{' '}
									{futureSchedule.start
										? `${formatRelativeTime(
												futureSchedule.start,
											)} - ${formatRelativeTime(futureSchedule.end)}`
										: 'Unknown'}
								</Text>
							</View>
						)}
					</>
				)
			}
		></CardItem>
	)
}
