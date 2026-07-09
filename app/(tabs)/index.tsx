import { useState } from 'react'
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHeaderHeight } from '@react-navigation/elements'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
import AreaCard, { AreaCardProps } from '@/components/dashboard/AreaCard'
import AreaSummaryCard from '@/components/dashboard/AreaSummaryCard'
import RecentActivityCard from '@/components/dashboard/RecentActivityCard'
import StatusScreen from '@/components/status/StatusScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import '@/global.css'
import { areasQueryFn } from '@/queries/areas'
import { profileQueryFn } from '@/queries/profile'

const mockActiveAreaData: AreaCardProps['areaData'] = [
	{
		name: 'Pago de las Viñas',
		activeStation: {
			name: 'Pozo de la Loma',
			time: '2026-07-06T09:55:00+02:00',
		},
	},
	{
		name: 'Los Almendrales',
		activeStation: {
			name: 'Finca El Mirador',
			time: '2026-07-06T10:15:00+02:00',
		},
	},
	{
		name: 'Barranco del Acebuchal',
		activeStation: {
			name: 'Pozo del Camino',
			time: '2026-07-06T10:45:00+02:00',
		},
	},
]

const mockIncomingAreaData: AreaCardProps['areaData'] = [
	{
		name: 'Cortijo Justo',
		activeStation: {
			name: 'Pozo Llano',
			time: '2026-07-07T09:55:00+02:00',
		},
	},
	{
		name: 'Cuesta Almachar',
		activeStation: {
			name: 'Finca Victoria',
			time: '2026-07-07T06:15:00+02:00',
		},
	},
	{
		name: 'Llanos del Río',
		activeStation: {
			name: 'Alrededores del Río',
			time: '2026-07-07T10:45:00+02:00',
		},
	},
]

const mockActiveActions: AreaAction[] = [
	{ label: 'Stop Now', onPress: () => console.log('Stop Now pressed') },
	{ label: 'Pause', onPress: () => console.log('Pause pressed') },
]

interface AreaAction {
	label: string
	onPress: () => void
}
interface ActivityEvent {
	id: string
	title: string
	description: string
	time: string
	status: 'success' | 'warning' | 'info' | 'fault'
	icon: string
}

const mockIncomingActions: AreaAction[] = [
	{ label: 'Start Now', onPress: () => console.log('Start Now pressed') },
	{ label: 'Schedule', onPress: () => console.log('Schedule pressed') },
]

function buildMockEvents(): ActivityEvent[] {
	const now = Date.now()
	const minutesAgo = (m: number) => new Date(now - m * 60000).toISOString()

	return [
		{
			id: '1',
			title: 'Irrigation completed',
			description: 'Pago de las Viñas · Pozo de la Loma ran for 42 min',
			time: minutesAgo(12),
			status: 'success',
			icon: 'check-circle-outline',
		},
		{
			id: '2',
			title: 'Low soil moisture',
			description: 'Los Almendrales · Finca El Mirador below 20%',
			time: minutesAgo(48),
			status: 'warning',
			icon: 'water-alert-outline',
		},
		{
			id: '3',
			title: 'Sensor reconnected',
			description: 'Barranco del Acebuchal · Pozo del Camino back online',
			time: minutesAgo(95),
			status: 'info',
			icon: 'access-point-check',
		},
		{
			id: '4',
			title: 'Valve fault detected',
			description: 'Cortijo Justo · Pozo Llano did not respond',
			time: minutesAgo(260),
			status: 'fault',
			icon: 'alert-circle-outline',
		},
		{
			id: '5',
			title: 'Schedule updated',
			description: 'Cuesta Almachar · Finca Rogelio moved to 06:30',
			time: minutesAgo(430),
			status: 'info',
			icon: 'calendar-edit',
		},
	]
}

export default function DashboardTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const headerHeight = useHeaderHeight()

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

	const areaCount = areas?.length || 0
	// TODO: Send a command to linked devices to make them report their status
	// and parse it to determine which areas are active
	const activeAreaCount = 0
	const onlineAreaCount =
		areas?.filter(
			// TODO: Replace this with online check over MQTT instead of DB flush timestamp
			// 5 minutes
			(area) => Date.now() - new Date(area.lastSeen).getTime() < 5 * 60 * 1000,
		).length || 0
	const recentEvents = buildMockEvents()
	const firstName = profile?.fullName?.split(' ')[0]

	// Handler to refresh areas and profile data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: ['areas'] })
			// Name of the user might have changed, so refresh profile as well
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
		} catch (error) {
			console.error('Error refreshing areas:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

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
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
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
				image={
					<ServerFailureIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Dashboard Unavailable"
				subtitle="We couldn’t reach the server to load your dashboard data."
				hint="Local device features are still available, but cloud functionality won’t work until the connection is restored."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}
	// --- Missing or unavailable dashboard data ---
	if (!profile || !areas) {
		return (
			<StatusScreen
				image={
					<FilesMissingIllustration
						width={200}
						height={220}
						color={theme.colors.accentBlue}
					/>
				}
				title="Dashboard Data Unavailable"
				subtitle="Some dashboard data couldn’t be loaded."
				hint="Local device features are still available, but some cloud functionality may be limited."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	return (
		<ScrollView
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
			}}
		>
			<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			<AreaSummaryCard
				firstName={firstName}
				areaCount={areaCount}
				activeAreaCount={activeAreaCount}
				onlineAreaCount={onlineAreaCount}
				// TODO: Replace this with actual alert count from status topics over MQTT
				alertCount={5}
			/>
			<View>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<SectionTitle text="Active Now" />
				</View>
				<AreaCard areaData={mockActiveAreaData} actions={mockActiveActions} />
			</View>
			<View>
				<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
					<SectionTitle text="Incoming" />
				</View>
				<AreaCard
					areaData={mockIncomingAreaData}
					actions={mockIncomingActions}
				/>
			</View>
			<View>
				<SectionTitle text="Recent" />
				<RecentActivityCard events={recentEvents} />
			</View>
		</ScrollView>
	)
}
