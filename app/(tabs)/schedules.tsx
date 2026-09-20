import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

import SchedulesTabScreen from '@/components/schedules/SchedulesTabScreen'
import StatusScreen from '@/components/status/StatusScreen'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { areasQueryFn } from '@/queries/areas'
import { areaScheduleQueryFn } from '@/queries/schedule'

const LAST_SCHEDULE_AREA_KEY = 'hydrolink:last-schedule-area'

export default function ScheduleTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const router = useRouter()
	const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null)
	const [selectionReady, setSelectionReady] = useState(false)
	const { isRefreshing, refresh } = usePullToRefresh()

	// Query for fetching the user's linked areas from the API for populating
	// the area picker.
	const {
		data: areas,
		isPending: areasPending,
		error: areasError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
		refetchInterval: 30_000,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	})

	useEffect(() => {
		if (areas === undefined) return

		let cancelled = false
		const restoreSelection = async () => {
			try {
				const storedKey = await AsyncStorage.getItem(LAST_SCHEDULE_AREA_KEY)
				const restoredKey =
					storedKey && areas.some((area) => area.key === storedKey)
						? storedKey
						: (areas[0]?.key ?? null)

				if (!cancelled) {
					setSelectedAreaKey(restoredKey)
					setSelectionReady(true)
				}
			} catch (error) {
				console.error('Error restoring schedule area:', error)
				if (!cancelled) {
					setSelectedAreaKey(areas[0]?.key ?? null)
					setSelectionReady(true)
				}
			}
		}

		void restoreSelection()
		return () => {
			cancelled = true
		}
	}, [areas])

	const handleSelectArea = (areaKey: string) => {
		setSelectedAreaKey(areaKey)
		void AsyncStorage.setItem(LAST_SCHEDULE_AREA_KEY, areaKey).catch(
			(error) => {
				console.error('Error saving schedule area:', error)
			},
		)
	}

	// Query for fetching user's schedules
	const {
		data: schedules,
		isPending: schedulesPending,
		error: scheduleLoadError,
	} = useQuery({
		queryKey: [...tanstackKeys.SCHEDULES, selectedAreaKey],
		queryFn: () => areaScheduleQueryFn(selectedAreaKey ?? ''),
		refetchInterval: 30_000,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: selectedAreaKey !== null,
	})

	// Handler to go to the new schedule creation screen
	const handleCreateNewSchedule = () => {
		if (!selectedAreaKey) return
		router.push(`/schedules/new?areaKey=${selectedAreaKey}`)
	}
	const handleEditSchedule = (date: string) => {
		if (!selectedAreaKey) return
		router.push(
			`/schedules/new?areaKey=${encodeURIComponent(selectedAreaKey)}&editDate=${encodeURIComponent(date)}`,
		)
	}

	// Handler to refresh data on pull-to-refresh
	const onRefresh = () =>
		refresh(async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS }),
				queryClient.invalidateQueries({ queryKey: tanstackKeys.SCHEDULES }),
			])
		}).catch((error) => {
			console.error('Error refreshing schedules:', error)
		})

	// Before an area is selected, surface the areas list's own loading/error
	// states so it's obvious whether the picker will be populated.
	if ((!selectionReady && areasPending) || (areas && !selectionReady)) {
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
					Loading areas...
				</Text>
			</View>
		)
	}

	if (selectedAreaKey === null && areasError) {
		return (
			<StatusScreen
				variant="network-error"
				title="Areas Unavailable"
				subtitle="We couldn't load your linked areas. Check your connection and try again."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// Only show the loading state once an area has actually been selected.
	if (selectedAreaKey !== null && schedulesPending) {
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
					Loading schedules...
				</Text>
			</View>
		)
	}

	if (scheduleLoadError) {
		return (
			<StatusScreen
				variant="network-error"
				title="Schedules Unavailable"
				subtitle="We couldn't reach the server. Try again shortly."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	return (
		<SchedulesTabScreen
			areas={areas ?? []}
			schedules={schedules ?? []}
			isRefreshing={isRefreshing}
			onRefresh={onRefresh}
			onCreateNewSchedule={handleCreateNewSchedule}
			onEditSchedule={handleEditSchedule}
			selectedAreaKey={selectedAreaKey}
			onSelectArea={handleSelectArea}
		/>
	)
}
