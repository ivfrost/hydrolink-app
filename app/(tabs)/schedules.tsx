import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

import SchedulesTabScreen from '@/components/schedules/SchedulesTabScreen'
import StatusScreen from '@/components/status/StatusScreen'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { areasQueryFn } from '@/queries/areas'
import { areaScheduleQueryFn } from '@/queries/schedule'

export default function ScheduleTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const router = useRouter()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null)

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

	// Handler to refresh data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS }),
				queryClient.invalidateQueries({ queryKey: tanstackKeys.SCHEDULES }),
			])
		} catch (error) {
			console.error('Error refreshing schedules:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	// Before an area is selected, surface the areas list's own loading/error
	// states so it's obvious whether the picker will be populated.
	if (selectedAreaKey === null && areasPending) {
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
			selectedAreaKey={selectedAreaKey}
			onSelectArea={setSelectedAreaKey}
		/>
	)
}
