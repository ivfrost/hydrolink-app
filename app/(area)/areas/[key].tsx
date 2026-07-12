import { useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'

import AreaSummaryCardItem from '@/components/areas/AreaSummaryCardItem'
import { EditableAreaInfoCard } from '@/components/areas/EditableAreaInfoCard'
import Card from '@/components/layout/Card'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { areasQueryFn } from '@/queries/areas'
import { useAreaStore } from '@/stores/areaStore'
import { Area, AreaUpdatePayload } from '@/types/area'

export default function AreaInfoScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const { name, location, description, imageUrl, firmware, technicalName } =
		useLocalSearchParams() as unknown as Area
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [areaState, setAreaState] = useState<Partial<Area>>({
		name: '',
		location: '',
		description: '',
	})
	const reconnectMqtt = useMqtt().reconnect
	const mqttAreas = useAreaStore((state) => state.areas)
	const isAreaOnline = useAreaStore((state) => state.isOnline)
	const { key } = useLocalSearchParams() as { key: string }
	console.log('Area component rendered with params:', {
		name,
		location,
		description,
		imageUrl,
		firmware,
		technicalName,
	})
	console.log('Area key:', key)

	// Query for fetching user's areas
	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})

	const area = areas?.find((a) => a.key === key)

	// Handler to refresh areas data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: ['areas'] })
			reconnectMqtt()
		} catch (error) {
			console.error('Error refreshing areas:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	const handleInfoChange = (field: keyof AreaUpdatePayload, value: string) => {
		setAreaState((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	// Effect to initialize the input state with the fetched area data
	useEffect(() => {
		if (areasPending || areaLoadError || !areas) return
		const area = areas.find((a) => a.key === key)
		if (area) {
			setAreaState({
				name: area.name || '',
				location: area.location || '',
				description: area.description || '',
			})
		}
		console.log("areaState updated with area's info:", areaState)
	}, [areas, areasPending, areaLoadError, key])

	// Loading state while areas are being fetched
	if (areasPending) {
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
					Loading areas…
				</Text>
			</View>
		)
	}

	// Error state if there was an issue fetching areas
	if (areaLoadError) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<Text style={{ color: theme.colors.textSecondary }}>
					Error loading areas. Please try again later.
				</Text>
			</View>
		)
	}

	// Error state if the specific area was not found
	if (!area) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<Text style={{ color: theme.colors.textSecondary }}>
					Area not found. Please check the area key and try again.
				</Text>
			</View>
		)
	}

	const areaData = mqttAreas[area.key]
	const lastUpdatedStr = areaData?.lastUpdated
	const allStations = Object.values(areaData.stations || {})
	const solenoids = allStations.filter((s) => s.type === 'Solenoid')
	const pumps = allStations.filter((s) => s.type === 'Pump')
	const fertilizers = allStations.filter((s) => s.type === 'Fertilizer')
	const sensors = allStations.filter((s) => s.type === 'Sensor')
	const unclassified = allStations.filter((s) => s.type === 'Unknown')
	const online = isAreaOnline(area.key)

	return (
		<KeyboardAwareScrollView
			bottomOffset={theme.space.stickyBarHeight}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			}
		>
			<View>
				<Text>{area.key}</Text>
				<Text>{online ? 'Online' : 'Offline'}</Text>
				<Text>
					{lastUpdatedStr
						? `Last Updated: ${lastUpdatedStr}`
						: 'No updates yet'}
				</Text>
				<Card>
					<AreaSummaryCardItem
						solenoidCount={solenoids.length}
						pumpCount={pumps.length}
						fertilizerCount={fertilizers.length}
						sensorCount={sensors.length}
					/>
				</Card>
			</View>
			<EditableAreaInfoCard
				name={areaState.name}
				description={areaState.description}
				onInfoChange={handleInfoChange}
			/>
		</KeyboardAwareScrollView>
	)
}
