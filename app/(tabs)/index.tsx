import AreaSummaryCard from '@/components/dashboard/AreaSummaryCard'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import RecentActivityCard from '@/components/dashboard/RecentActivityCard'
import { useTheme } from '@/context/ThemeContext'
import '@/global.css'
import { areasQuery } from '@/queries/areas'
import { profileQuery } from '@/queries/profile'
import { useHeaderHeight } from '@react-navigation/elements'
import { useQuery } from '@tanstack/react-query'
import { Animated, Text, View } from 'react-native'
import { tabScrollValues } from './_layout'
import { usePathname } from 'expo-router'
import SectionTitle from '@/components/ui/SectionTitle'
import AreaCard, { AreaCardProps } from '@/components/dashboard/AreaCard'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const mockActiveAreaData: AreaCardProps['areaData'] = [
	{
		name: 'Pago de las Viñas',
		activeStation: {
			name: 'Pozo de la Loma',
			time: '2026-07-01T09:55:00+02:00',
		},
	},
	{
		name: 'Los Almendrales',
		activeStation: {
			name: 'Finca El Mirador',
			time: '2026-07-01T10:15:00+02:00',
		},
	},
	{
		name: 'Barranco del Acebuchal',
		activeStation: {
			name: 'Pozo del Camino',
			time: '2026-07-01T10:45:00+02:00',
		},
	},
]

const mockIncomingAreaData: AreaCardProps['areaData'] = [
	{
		name: 'Cortijo Justo',
		activeStation: {
			name: 'Pozo Llano',
			time: '2026-07-01T09:55:00+02:00',
		},
	},
	{
		name: 'Cuesta Almachar',
		activeStation: {
			name: 'Finca Rogelio',
			time: '2026-07-01T10:15:00+02:00',
		},
	},
	{
		name: 'Llanos del Río',
		activeStation: {
			name: 'Alrededores del Río',
			time: '2026-07-01T10:45:00+02:00',
		},
	},
]

const mockActiveActions: AreaAction[] = [
	{
		label: 'Stop Now',
		onPress: () => {
			console.log('Stop Now pressed')
		},
	},
	{
		label: 'Pause',
		onPress: () => {
			console.log('Pause pressed')
		},
	},
]

const mockIncomingActions: AreaAction[] = [
	{
		label: 'Start Now',
		onPress: () => {
			console.log('Start Now pressed')
		},
	},
	{
		label: 'Schedule',
		onPress: () => {
			console.log('Schedule pressed')
		},
	},
]

// Realistic recent events relative to "now" so times always read naturally
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

export default function Index() {
	const theme = useTheme()
	const pathname = usePathname()
	const currentScrollY = tabScrollValues[pathname] || new Animated.Value(0)
	const insets = useSafeAreaInsets()
	const headerHeight = useHeaderHeight()

	const { data: areas, isPending, error } = useQuery(areasQuery)
	const { data: profile } = useQuery(profileQuery)
	const areaCount = areas?.details.length || 0

	// Areas seen in the last 5 minutes are considered "active"
	const activeAreaCount = 3

	// areas?.details.filter((area) => {
	// 	const timeFromLastSeenMs = Date.now() - new Date(area.lastSeen).getTime()
	// 	return timeFromLastSeenMs < 5000 * 60
	// }).length
	// Areas which have at least one station active are considered "online"
	const onlineAreaCount = 6

	const recentEvents = buildMockEvents()
	const firstName = profile?.details.fullName?.split(' ')[0]

	return (
		<Animated.ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: currentScrollY } } }],
				{ useNativeDriver: true },
			)}
			scrollEventThrottle={16}
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight + theme.space.sm,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
			}}
		>
			{isPending ? (
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading areas...
				</Text>
			) : areas?.details.length === 0 ? (
				<Text style={{ color: theme.colors.textSecondary }}>
					No areas linked. Please link an area to get started.
				</Text>
			) : (
				<>
					<AreaSummaryCard
						firstName={firstName}
						areaCount={areaCount}
						activeAreaCount={activeAreaCount || 0}
						onlineAreaCount={onlineAreaCount}
						alertCount={5}
					/>
					<View>
						<View
							style={{ flexDirection: 'row', justifyContent: 'space-between' }}
						>
							<SectionTitle text="Active Now" />
							{/* <MaterialCommunityIcons
								name="drag"
								size={24}
								color={theme.colors.textMuted}
							/> */}
						</View>
						<AreaCard
							variant="active"
							areaData={mockActiveAreaData}
							actions={mockActiveActions}
						/>
					</View>
					{/* Actions: start now -> stops currently running and starts selected */}
					<View>
						<View
							style={{ flexDirection: 'row', justifyContent: 'space-between' }}
						>
							<SectionTitle text="Incoming" />
							{/* <MaterialCommunityIcons
								name="drag"
								size={24}
								color={theme.colors.textMuted}
							/> */}
						</View>
						<AreaCard
							variant="incoming"
							areaData={mockIncomingAreaData}
							actions={mockIncomingActions}
						/>
					</View>
					<View>
						<SectionTitle text="Recent" />
						<RecentActivityCard events={recentEvents} />
					</View>
				</>
			)}
		</Animated.ScrollView>
	)
}
