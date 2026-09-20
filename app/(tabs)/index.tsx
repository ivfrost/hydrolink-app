import { useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import AreaCard, { AreaCardProps } from '@/components/dashboard/AreaCard'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import ScrollView from '@/components/layout/ScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import '@/global.css'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { t } from '@/i18n'
import { areasQueryFn } from '@/queries/areas'
import { profileQueryFn } from '@/queries/profile'
import { areaScheduleQueryFn } from '@/queries/schedule'
import { useAreaStore } from '@/stores/areaStore'
import type { Schedule, TimeWindowResponse } from '@/types/schedule'

function resolveWindowStart(
	schedule: Schedule,
	window: TimeWindowResponse,
	windowsByPin: Map<number, TimeWindowResponse>,
	resolving: Set<number> = new Set(),
): Date | null {
	if (resolving.has(window.id)) return null

	// Fixed times are authoritative when present. This keeps the dashboard
	// tolerant of API enum casing/serialization differences.
	if (window.fixedTime) {
		const fixedTime = String(window.fixedTime)
		const date = new Date(
			fixedTime.includes('T')
				? fixedTime
				: `${schedule.date.slice(0, 10)}T${fixedTime}`,
		)
		return Number.isNaN(date.getTime()) ? null : date
	}

	if (
		String(window.startType).toUpperCase() !== 'RELATIVE' ||
		window.linkedPin == null ||
		window.offsetMinutes == null
	) {
		return null
	}

	const linkedWindow = windowsByPin.get(Number(window.linkedPin))
	if (!linkedWindow) return null

	const nextResolving = new Set(resolving)
	nextResolving.add(window.id)
	const linkedStart = resolveWindowStart(
		schedule,
		linkedWindow,
		windowsByPin,
		nextResolving,
	)
	if (!linkedStart) return null

	const referenceTime =
		window.linkedReferencePoint === 'END'
			? linkedStart.getTime() + linkedWindow.durationMinutes * 60_000
			: linkedStart.getTime()

	return new Date(referenceTime + window.offsetMinutes * 60_000)
}

export default function DashboardTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const [weatherRefreshKey, setWeatherRefreshKey] = useState(0)
	const [currentTime, setCurrentTime] = useState<number | null>(null)
	const { isRefreshing, refresh } = usePullToRefresh()

	useEffect(() => {
		const updateCurrentTime = () => setCurrentTime(Date.now())
		updateCurrentTime()
		const interval = setInterval(updateCurrentTime, 60_000)

		return () => clearInterval(interval)
	}, [])

	// Queries for fetching areas and profile data
	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})
	const {
		data: profile,
		error: profileLoadError,
		isPending: profilePending,
	} = useQuery({
		queryKey: tanstackKeys.PROFILE,
		queryFn: profileQueryFn,
	})
	const mqttAreas = useAreaStore((state) => state.areas)
	const scheduleQueries = useQueries({
		queries: (areas ?? []).map((area) => ({
			queryKey: ['schedules', area.key],
			queryFn: () => areaScheduleQueryFn(area.key),
			enabled: Boolean(area.key),
			refetchInterval: 30_000,
			refetchOnWindowFocus: true,
		})),
	})

	const activeAreaData: AreaCardProps['areaData'] = (areas ?? []).flatMap(
		(area) => {
			const liveArea = mqttAreas[area.key]
			return Object.values(liveArea?.stations ?? {})
				.filter((station) => station.status.state === 'Running')
				.map((station) => ({
					name: station.name?.trim() || `Station ${station.id + 1}`,
					activeStation: {
						name: area.friendlyName || area.key,
						time: liveArea?.lastUpdated ?? area.lastSeen,
					},
				}))
		},
	)

	const incomingEntries = scheduleQueries.flatMap((query, index) => {
		const area = areas?.[index]
		if (!area || !query.data) return []

		return query.data.flatMap((schedule) => {
			const windowsByPin = new Map(
				schedule.windows.map((window) => [Number(window.pin), window]),
			)

			return schedule.windows.flatMap((window) => {
				const date = resolveWindowStart(schedule, window, windowsByPin)
				if (!date) return []

				return [
					{
						date,
						item: {
							name: `Station ${window.pin + 1}`,
							activeStation: {
								name: area.friendlyName || area.key,
								time: date.toISOString(),
							},
						},
					},
				]
			})
		})
	})

	const sortedIncomingEntries = [...incomingEntries].sort((first, second) => {
		const firstTime = first.date.getTime()
		const secondTime = second.date.getTime()

		if (Number.isNaN(firstTime)) return 1
		if (Number.isNaN(secondTime)) return -1
		return firstTime - secondTime
	})
	const upcomingEntries =
		currentTime === null
			? sortedIncomingEntries
			: sortedIncomingEntries.filter(
					({ date }) =>
						!Number.isNaN(date.getTime()) && date.getTime() > currentTime,
				)
	const incomingAreaData: AreaCardProps['areaData'] = (
		upcomingEntries.length > 0 ? upcomingEntries : sortedIncomingEntries
	)
		.slice(0, 6)
		.map(({ item }) => item)

	// Handler to refresh areas and profile data on pull-to-refresh
	const onRefresh = () =>
		refresh(async () => {
			await queryClient.invalidateQueries({ queryKey: ['areas'] })
			await queryClient.invalidateQueries({ queryKey: ['schedules'] })
			// Name of the user might have changed, so refresh profile as well
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
			setWeatherRefreshKey((key) => key + 1)
		}).catch((error) => {
			console.error('Error refreshing areas:', error)
		})

	// --- Loading state ---
	if (areasPending || profilePending) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accent} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading dashboard…
				</Text>
			</View>
		)
	}

	// --- Cloud/server/connection failure ---
	if (profileLoadError || areaLoadError) {
		// Cast to any or AppError to read custom properties safely in the log
		const pErr = profileLoadError as any
		const aErr = areaLoadError as any

		console.log(
			'Error loading dashboard data:',
			pErr ? { code: pErr.code, message: pErr.message } : null,
			aErr ? { code: aErr.code, message: aErr.message } : null,
		)

		return (
			<StatusScreen
				variant="network-error"
				title="Dashboard Unavailable"
				subtitle="We couldn't load your dashboard. Check your connection and try again."
				hint="Only local area features area available."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}
	// --- Missing or unavailable dashboard data ---
	if (!profile || !areas) {
		return (
			<StatusScreen
				variant="missing-data"
				title="Dashboard Data Unavailable"
				subtitle="Some dashboard data couldn't be loaded."
				hint="Only the local areas feature is available."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					progressViewOffset={20}
					colors={[theme.colors.accent]}
				/>
			}
		>
			<View
				style={{
					borderRadius: theme.radius.viewOverImage,
					overflow: 'hidden',
				}}
			>
				<DashboardHeader
					name={profile.fullName.split(' ')[0]}
					weatherRefreshKey={weatherRefreshKey}
				/>
			</View>

			<View
				style={{
					flexDirection: 'row',
					gap: theme.space.sm,
				}}
			>
				{[
					{
						label: t('dashboard.areas'),
						value: areas.length,
						icon: 'map-marker-radius-outline' as const,
					},
					{
						label: t('dashboard.activeNow'),
						value: activeAreaData.length,
						icon: 'water-pump' as const,
					},
				].map((stat) => (
					<View
						key={stat.label}
						style={{
							flex: 1,
							backgroundColor: theme.colors.surfaceRaised,
							borderRadius: theme.radius.boxInCard,
							paddingHorizontal: theme.space.lg,
							paddingVertical: theme.space.md,
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.space.sm,
						}}
					>
						<View
							style={{
								alignItems: 'center',
								height: theme.space.x4l,
								justifyContent: 'center',
								width: theme.space.x4l,
							}}
						>
							<MaterialCommunityIcons
								name={stat.icon}
								size={theme.space.iconSize}
								color={theme.colors.accent}
							/>
						</View>
						<View style={{ flex: 1 }}>
							<Text
								style={{
									color: theme.colors.textPrimary,
									fontSize: theme.font.lg,
									fontWeight: theme.fontWeight.semibold,
								}}
							>
								{stat.value}
							</Text>
							<Text
								style={{
									color: theme.colors.textSecondary,
									fontSize: theme.font.xs,
									marginTop: theme.space.x3s,
								}}
							>
								{stat.label}
							</Text>
						</View>
					</View>
				))}
			</View>

			<View>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<SectionTitle text={t('dashboard.activeNow')} />
				</View>
				{activeAreaData.length > 0 ? (
					<AreaCard areaData={activeAreaData} />
				) : (
					<Text
						style={{
							color: theme.colors.textSecondary,
							fontSize: theme.font.sm,
							paddingVertical: theme.space.md,
						}}
					>
						{t('dashboard.noRunningStations')}
					</Text>
				)}
			</View>
			<View>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<SectionTitle text={t('dashboard.incoming')} />
				</View>
				{incomingAreaData.length > 0 ? (
					<AreaCard areaData={incomingAreaData} />
				) : (
					<Text
						style={{
							color: theme.colors.textSecondary,
							fontSize: theme.font.sm,
							paddingVertical: theme.space.md,
						}}
					>
						{t('dashboard.noUpcomingStations')}
					</Text>
				)}
			</View>
		</ScrollView>
	)
}
