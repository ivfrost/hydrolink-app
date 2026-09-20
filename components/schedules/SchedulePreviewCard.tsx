import { Pressable, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'
import type { Schedule, TimeWindowResponse } from '@/types/schedule'

function formatDate(iso: string): string {
	const date = new Date(`${iso}T00:00:00`)
	if (Number.isNaN(date.getTime())) return iso
	return date.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'short',
		day: 'numeric',
	})
}

function formatClock(value: string | null): string {
	return value ? value.slice(0, 5) : '—'
}

function WindowRow({
	window,
	stationName,
	conflict,
}: {
	window: TimeWindowResponse
	stationName: (pin: number) => string
	conflict: boolean
}) {
	const theme = useTheme()
	const isFixed = window.startType === 'FIXED'
	const timing = isFixed
		? `${t('schedules.at')} ${formatClock(window.fixedTime)}`
		: `${window.offsetMinutes ?? 0} ${t('schedules.minutesFrom')} ${
				window.linkedPin != null
					? stationName(window.linkedPin)
					: t('schedules.anotherWindow')
			}`

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				gap: theme.space.md,
				padding: theme.space.md,
				borderRadius: theme.radius.boxInCard,
				backgroundColor: conflict
					? theme.colors.faultBg
					: theme.colors.surfaceSunken,
			}}
		>
			<MaterialCommunityIcons
				name={isFixed ? 'clock-outline' : 'link-variant'}
				size={18}
				color={conflict ? theme.colors.fault : theme.colors.textMuted}
			/>
			<View style={{ flex: 1 }}>
				<Text
					numberOfLines={1}
					style={{
						color: theme.colors.textPrimary,
						fontSize: theme.font.base,
						fontWeight: theme.fontWeight.semibold,
						lineHeight: theme.lineHeight.cardTextTitle,
					}}
				>
					{stationName(window.pin)}
				</Text>
				<Text
					numberOfLines={1}
					style={{
						color: conflict ? theme.colors.fault : theme.colors.textSecondary,
						fontSize: theme.font.sm,
					}}
				>
					{timing} · {window.durationMinutes} {t('schedules.minutes')}
					{conflict ? ` · ${t('schedules.overlapsAnotherWindow')}` : ''}
				</Text>
			</View>
			{conflict && (
				<MaterialCommunityIcons
					name="alert-circle-outline"
					size={18}
					color={theme.colors.fault}
				/>
			)}
		</View>
	)
}

export default function SchedulePreviewCard({
	schedule,
	stationName,
	onPress,
}: {
	schedule: Schedule
	stationName: (pin: number) => string
	onPress?: () => void
}) {
	const theme = useTheme()
	const conflictIds = new Set(schedule.conflictingWindowIds)

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => ({
				opacity: pressed ? 0.9 : 1,
			})}
		>
			<View
				style={{
					borderRadius: theme.radius.card,
					backgroundColor: theme.colors.surfaceRaised,
					paddingHorizontal: theme.space.lg,
					paddingVertical: theme.space.xl,
					gap: theme.space.lg,
				}}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: theme.space.md,
					}}
				>
					<View
						style={{
							width: 38,
							height: 38,
							borderRadius: theme.radius.headingIcon,
							alignItems: 'center',
							justifyContent: 'center',
							backgroundColor: theme.colors.accentTint,
						}}
					>
						<MaterialCommunityIcons
							name="calendar-clock"
							size={20}
							color={theme.colors.accent}
						/>
					</View>
					<View style={{ flex: 1, gap: theme.space.x2s }}>
						<Text
							numberOfLines={1}
							style={{
								color: theme.colors.textPrimary,
								fontSize: theme.font.base,
								fontWeight: theme.fontWeight.semibold,
							}}
						>
							{formatDate(schedule.date)}
						</Text>
						<Text
							style={{
								color: theme.colors.textMuted,
								fontSize: theme.font.sm,
								lineHeight: theme.lineHeight.cardTextSubtitle,
							}}
						>
							{schedule.windows.length}{' '}
							{schedule.windows.length === 1
								? t('schedules.window')
								: t('schedules.windows')}
						</Text>
					</View>
				</View>

				{schedule.windows.length === 0 ? (
					<Text
						style={{
							color: theme.colors.textSecondary,
							fontSize: theme.font.sm,
						}}
					>
						{t('schedules.noWindowsForDay')}
					</Text>
				) : (
					<View style={{ gap: theme.space.sm }}>
						{schedule.windows.map((window) => (
							<WindowRow
								key={window.id}
								window={window}
								stationName={stationName}
								conflict={conflictIds.has(window.id)}
							/>
						))}
					</View>
				)}
			</View>
		</Pressable>
	)
}
