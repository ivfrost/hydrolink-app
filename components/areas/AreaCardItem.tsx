import { useEffect, useState, type ReactNode } from 'react'
import { Animated, Text, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import Badge from '@/components/ui/Badge'
import CardItem from '@/components/ui/CardItem'
import { useTheme } from '@/context/ThemeContext'
import { Station, StationSchedule } from '@/types/area'
import { formatRelativeFromEpochStr } from '@/utils/formatRelativeTime'

export interface AreaCardItemProps {
	title: string
	subtitle: string | ReactNode
	online: boolean
	updating?: boolean
	activeSolenoid?: Station | undefined
	activeFertilizers?: Station[] | undefined
	sensors?: Station[] | undefined
	schedules?: StationSchedule[] | undefined
	onPress?: () => void
}

// How often to refresh relative ("time ago") labels while the card is visible.
const RELATIVE_TIME_REFRESH_MS = 30_000

const STATION_NAME = (station: Station) =>
	station.name?.trim() ? station.name : `Station ${station.id + 1}`

// Formats an elapsed duration (ms) as a compact relative label ("12m",
// "1h 5m", "less than a minute").
function formatElapsedDuration(ms: number): string {
	const totalMinutes = Math.floor(Math.max(0, ms) / 60000)
	if (totalMinutes < 1) return 'less than a minute'
	const days = Math.floor(totalMinutes / 1440)
	const hours = Math.floor((totalMinutes % 1440) / 60)
	const minutes = totalMinutes % 60
	if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`
	if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
	return `${minutes}m`
}

// How long the station has been running. Manual runs carry their own start
// time; scheduled runs use the current schedule start. Returns null when no
// start time is known so callers can omit the "Running for X" part.
function runningDurationLabel(station: Station, now: number): string | null {
	const manualStart = station.status.manualOverride?.start
	if (manualStart) return formatElapsedDuration(now - manualStart)
	const scheduleStart = station.schedules[1]?.start
	if (scheduleStart) {
		return formatElapsedDuration(now - new Date(scheduleStart).getTime())
	}
	return null
}

function causeLabel(station: Station): string {
	switch (station.status.cause) {
		case 'Manual':
			return 'Manual Mode'
		case 'Sensor':
			return 'Sensor Triggered'
		case 'Schedule':
			return 'Scheduled'
		default:
			return 'Unknown Cause'
	}
}

function formatScheduleRange(schedule: StationSchedule): string {
	if (!schedule.start || !schedule.end) return 'Unknown'
	return `${formatRelativeFromEpochStr(schedule.start)} - ${formatRelativeFromEpochStr(
		schedule.end,
	)}`
}

function ScheduleRow({
	label,
	icon,
	schedule,
	active = false,
}: {
	label: string
	icon: keyof typeof MaterialCommunityIcons.glyphMap
	schedule: StationSchedule
	active?: boolean
}) {
	const theme = useTheme()
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.space.sm,
				marginTop: theme.space.md,
				padding: theme.space.sm,
				backgroundColor: active
					? theme.colors.scheduleActiveBg
					: theme.colors.card,
				borderWidth: active ? 1 : 0,
				borderColor: active ? theme.colors.scheduleActiveBorder : 'transparent',
				borderRadius: theme.radius.boxInCard,
			}}
		>
			<MaterialCommunityIcons
				name={icon}
				size={16}
				color={active ? theme.colors.scheduleActive : theme.colors.textMuted}
			/>
			<Text
				style={{
					flex: 1,
					color: active
						? theme.colors.scheduleActive
						: theme.colors.textSecondary,
					fontSize: theme.font.sm,
					fontWeight: active ? '600' : '400',
				}}
			>
				{label}: {formatScheduleRange(schedule)}
			</Text>
		</View>
	)
}

// Pulsing "Running" pill shown next to the active solenoid name.
function RunningPill({
	color,
	borderColor,
}: {
	color: string
	borderColor: string
}) {
	const theme = useTheme()
	const [opacity] = useState(() => new Animated.Value(1))

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 0.4,
					duration: 700,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 1,
					duration: 700,
					useNativeDriver: true,
				}),
			]),
		)
		loop.start()
		return () => loop.stop()
	}, [opacity])

	return (
		<Animated.View
			style={{
				opacity,
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.space.x2s,
				backgroundColor: theme.colors.card,
				borderRadius: theme.radius.pill,
				borderWidth: 1,
				borderColor,
				paddingHorizontal: theme.space.sm,
				paddingVertical: theme.space.x2s,
			}}
		>
			<MaterialCommunityIcons name="play" size={10} color={color} />
			<Text
				style={{
					color,
					fontSize: theme.font.xs,
					fontWeight: '700',
				}}
			>
				Running
			</Text>
		</Animated.View>
	)
}

export function UpdatingLabel() {
	const theme = useTheme()
	return (
		<Text
			style={{
				color: theme.colors.online,
				fontSize: theme.font.sm,
				fontWeight: '600',
			}}
		>
			Updating firmware…
		</Text>
	)
}

export default function AreaCardItem({
	title,
	subtitle,
	online,
	updating = false,
	activeSolenoid,
	activeFertilizers,
	sensors,
	schedules,
	onPress,
}: AreaCardItemProps) {
	const theme = useTheme()
	const currentSchedule = schedules?.[1]
	const pastSchedule = schedules?.[0]
	const futureSchedule = schedules?.[2]

	// Keep a `now` timestamp updated on a timer so relative labels and the
	// progress bar stay accurate while the card is visible. Updated inside
	// callbacks (never synchronously in the effect body) so renders stay pure.
	const [now, setNow] = useState(0)
	useEffect(() => {
		const initial = setTimeout(() => setNow(Date.now()), 0)
		const id = setInterval(() => setNow(Date.now()), RELATIVE_TIME_REFRESH_MS)
		return () => {
			clearTimeout(initial)
			clearInterval(id)
		}
	}, [])

	// Accent colors follow the trigger cause so the "why" of a run is glanceable.
	const accent =
		activeSolenoid?.status.cause === 'Sensor'
			? {
					color: theme.colors.online,
					bg: theme.colors.onlineBg,
					border: theme.colors.onlineBorder,
				}
			: activeSolenoid?.status.cause === 'Schedule'
				? {
						color: theme.colors.scheduled,
						bg: theme.colors.scheduledBg,
						border: theme.colors.scheduledBorder,
					}
				: {
						color: theme.colors.running,
						bg: theme.colors.runningBg,
						border: theme.colors.runningBorder,
					}

	// Manual runs carry a duration; derive progress + remaining for the bar.
	const manualOverride = activeSolenoid?.status.manualOverride
	const progressPct =
		manualOverride?.start &&
		manualOverride.end &&
		manualOverride.end > manualOverride.start
			? Math.min(
					100,
					Math.max(
						0,
						((now - manualOverride.start) /
							(manualOverride.end - manualOverride.start)) *
							100,
					),
				)
			: 0
	const remainingMs = manualOverride?.end
		? Math.max(0, manualOverride.end - now)
		: 0
	// How long the running solenoid has been running, if a start time is known.
	const runningFor = activeSolenoid
		? runningDurationLabel(activeSolenoid, now)
		: null

	return (
		<CardItem
			title={title}
			subtitle={updating ? <UpdatingLabel /> : subtitle}
			icon={
				updating ? 'update' : online ? 'map-marker-check' : 'map-marker-off'
			}
			statusColor={
				updating
					? theme.colors.online
					: online
						? theme.colors.online
						: theme.colors.fault
			}
			statusBg={
				updating
					? theme.colors.onlineBg
					: online
						? theme.colors.onlineBg
						: theme.colors.faultBg
			}
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
							size={theme.space.iconSize}
							color={theme.colors.textMuted}
						/>
					</View>
				)
			}
			bottomElement={
				!updating &&
				(activeSolenoid ||
					pastSchedule ||
					currentSchedule ||
					futureSchedule) ? (
					<>
						{activeSolenoid && (
							<>
								{/* Currently running solenoid */}
								<View
									style={{
										borderRadius: theme.radius.boxInCard,
										backgroundColor: accent.bg,
										padding: theme.space.lg,
									}}
								>
									<View
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											gap: theme.space.sm,
										}}
									>
										<Text
											numberOfLines={1}
											style={{
												color: accent.color,
												fontSize: theme.font.base,
												fontWeight: '600',
												flexShrink: 1,
											}}
										>
											{STATION_NAME(activeSolenoid)}
										</Text>
										<RunningPill
											color={accent.color}
											borderColor={accent.border}
										/>
									</View>
									<Text
										style={{
											color: theme.colors.textSecondary,
											fontSize: theme.font.sm,
											fontWeight: '400',
											marginTop: 2,
										}}
									>
										{causeLabel(activeSolenoid)}
										{runningFor ? ` • Running for ${runningFor}` : ''}
									</Text>

									{manualOverride?.start &&
										manualOverride.end &&
										manualOverride.end > now && (
											<View style={{ marginTop: theme.space.sm }}>
												<View
													style={{
														height: 4,
														borderRadius: 2,
														backgroundColor: accent.border,
														overflow: 'hidden',
													}}
												>
													<View
														style={{
															width: `${progressPct}%`,
															height: '100%',
															borderRadius: 2,
															backgroundColor: accent.color,
														}}
													/>
												</View>
												<Text
													style={{
														marginTop: theme.space.x2s,
														fontSize: theme.font.xs,
														color: theme.colors.textSecondary,
													}}
												>
													Ends in {formatElapsedDuration(remainingMs)}
												</Text>
											</View>
										)}
								</View>
								{/* Running fertilizers */}
								{activeFertilizers && activeFertilizers.length > 0 && (
									<View
										style={{
											flexDirection: 'row',
											flexWrap: 'wrap',
											gap: theme.space.sm,
											marginTop: theme.space.md,
										}}
									>
										{activeFertilizers?.map((fertilizer) => (
											<Badge
												icon="sprout"
												key={`fertilizer-${fertilizer.id}`}
												text={[
													STATION_NAME(fertilizer),
													runningDurationLabel(fertilizer, now),
												]
													.filter(Boolean)
													.join(' · ')}
												color={theme.colors.running}
												borderColor={theme.colors.runningBorder}
												backgroundColor={theme.colors.runningBg}
											/>
										))}
									</View>
								)}
							</>
						)}
						{pastSchedule && (
							<ScheduleRow
								label="Last"
								icon="history"
								schedule={pastSchedule}
							/>
						)}
						{currentSchedule && (
							<ScheduleRow
								label="Current"
								icon="timer-play-outline"
								schedule={currentSchedule}
								active
							/>
						)}
						{futureSchedule && (
							<ScheduleRow
								label="Next"
								icon="calendar-clock-outline"
								schedule={futureSchedule}
							/>
						)}
					</>
				) : null
			}
		></CardItem>
	)
}
