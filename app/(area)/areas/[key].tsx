import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshControl, Text, View } from 'react-native'
import DraggableFlatList, {
	RenderItemParams,
} from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useMachine } from '@xstate/react'
import * as Burnt from 'burnt'
import { useLocalSearchParams } from 'expo-router'

import AreaHeader from '@/components/areas/AreaHeader'
import AreaSummaryCardItem from '@/components/areas/AreaSummaryCardItem'
import { EditableAreaInfoCard } from '@/components/areas/EditableAreaInfoCard'
import StationCardItem from '@/components/areas/StationCardItem'
import Card from '@/components/layout/Card'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import StatusScreen from '@/components/status/StatusScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import Subtext from '@/components/ui/Subtext'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { currentScreenMachine } from '@/machines/currentScreenMachine'
import { publishableTopics } from '@/services/mqtt'
import { useAreaStore } from '@/stores/areaStore'
import {
	Area,
	AreaUpdatePayload,
	Station,
	StationStatus,
	StationType,
} from '@/types/area'
import { MqttCommand } from '@/types/mqtt'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { getCommandTopic } from '@/utils/mqttTopics'

export default function AreaInfoScreen() {
	const theme = useTheme()
	const queryClient = useQueryClient()
	const { key } = useLocalSearchParams() as { key: string }
	const insets = useSafeAreaInsets()

	// Local state
	const [areaFormState, setAreaFormState] = useState<Partial<Area>>({
		name: '',
		location: '',
		description: '',
	})
	// We store a list of IDs and not snapshots to avoid desync with the live store data
	const [sortedStationIds, setSortedStationIds] = useState<number[]>([])

	const [minutes, setMinutes] = useState(15)
	const [pendingToggles, setPendingToggles] = useState<
		Record<number, 'Running' | 'Idle' | null>
	>({})

	// State machine for managing screen states
	const [currentScreenState, send] = useMachine(
		currentScreenMachine.provide({
			actions: {
				// Sync area state from store to local state when the machine enters the "ready" state
				syncAreaState: ({ context }) => {
					if (!context.areas) return
					const area = context.areas.find((a) => a.key === key)
					if (area) {
						setAreaFormState({
							name: area.name || '',
							location: area.location || '',
							description: area.description || '',
						})
					}
				},
				// Reset area state to the last known values from the store when discarding changes
				resetAreaState: ({ context }) => {
					if (!context.areas) return
					const area = context.areas.find((a) => a.key === key)
					if (area) {
						setAreaFormState({
							name: area.name || '',
							location: area.location || '',
							description: area.description || '',
						})
					} else {
						// fallback: clear the form
						setAreaFormState({ name: '', location: '', description: '' })
					}
				},
			},
		}),
		// Provide the queryClient and mqtt context to the state machine
		{
			input: { queryClient, mqtt: useMqtt() },
		},
	)

	// State machine derived area state (API data)
	const { areas: dbAreas, pendingStationTypeChange } =
		currentScreenState.context
	const dbArea = useMemo(
		() => dbAreas?.find((a) => a.key === key),
		[dbAreas, key],
	)
	// Area store derived state and actions (Real-time MQTT data)
	const publish = useMqtt().publish
	const mqttAreas = useAreaStore((state) => state.areas)
	const setTypeForAreaStationMqtt = useMqtt().setTypeForAreaStation
	const setTypeForAreaStationStore = useAreaStore(
		(state) => state.setTypeForAreaStation,
	)
	const getManualOverrideForStation = useAreaStore(
		(state) => state.getManualOverrideForStation,
	)
	const mqttAreaData = mqttAreas[dbArea?.key ?? '']
	const lastUpdatedStr = mqttAreaData?.lastUpdated || 'Never'
	const allStations = Object.values(mqttAreaData?.stations || {})
	const solenoids = allStations.filter((s) => s.type === 'Solenoid')
	const activeSolenoid = solenoids.find((s) => s.status.state === 'Running')
	const pumps = allStations.filter((s) => s.type === 'Pump')
	const fertilizers = allStations.filter((s) => s.type === 'Fertilizer')
	const sensors = allStations.filter((s) => s.type === 'Sensor')
	const unclassified = allStations.filter((s) => s.type === 'Unknown')
	const isAreaOnline = mqttAreaData?.online ?? false

	// Notify the machine whenever the store receives MQTT data so we can
	// clear the type change flag
	useEffect(() => {
		const storeArea = mqttAreas[key]
		if (!storeArea?.stations) return

		Object.values(storeArea.stations).forEach((station) => {
			const pendingType = pendingStationTypeChange[station.id]

			// If the machine is waiting for this station, and the store just updated
			// to target type, notify the machine that the update is complete
			if (pendingType && pendingType === station.type) {
				send({
					type: 'STATION_STATUS_UPDATE',
					stationId: station.id,
					newType: station.type,
				})
			}
		})
	}, [mqttAreas, key, pendingStationTypeChange, send])

	// Helper to check if a station type change is pending for a given station
	const isStationTypeChangePending = useCallback(
		(areaKey: string, stationId: number) => {
			return stationId in pendingStationTypeChange
		},
		[pendingStationTypeChange],
	)

	// Handler for updating area information in local state
	const handleInfoChange = useCallback(
		(field: keyof AreaUpdatePayload, value: string) => {
			setAreaFormState((prev) => ({
				...prev,
				[field]: value,
			}))
		},
		[],
	)

	// Handler for station actions (start/stop)
	// ESP publishes the new state back to the MQTT topic, store updates the UI
	const toggleStation = useCallback(
		(
			stationId: number,
			currentState: StationStatus['state'],
			durationMs?: string,
		) => {
			if (!dbArea) {
				console.error('Area not found for key:', key)
				return
			}

			// Prepare the MQTT command and publish it to all relevant topics for this area
			const action = currentState === 'Running' ? 'Stop' : 'Start'
			const targetState = action === 'Start' ? 'Running' : 'Idle'
			// Record the state we are waiting for so we can show a spinner in the UI
			setPendingToggles((prev) => ({ ...prev, [stationId]: targetState }))
			const command: MqttCommand = {
				action,
				stationId,
				cause: 'Manual',
				durationMs,
			}
			const serializedCommand = JSON.stringify(command)
			const areaTopic = publishableTopics.find((topic) =>
				topic.includes(dbArea.key),
			)
			if (!areaTopic) {
				console.error('No publishable topic found for area:', dbArea.key)
				return
			}
			publish(getCommandTopic(areaTopic), serializedCommand)

			Burnt.toast({
				title: `Sent ${action} command to station ${stationId + 1}.`,
				preset: 'done',
			})
		},
		[dbArea, key, publish],
	)

	// Helper to check if a station is currently in a pending state (either type change or start/stop)
	const isStationLoading = useCallback(
		(stationId: number) => {
			// Pull pending changes avoiding stale data from the closure
			const pendingChanges = currentScreenState.context.pendingStationTypeChange
			// Check if state machine is waiting for a type change
			const isTypePending = stationId in pendingChanges
			// Check if we are waiting for a start/stop command to complete
			const targetState = pendingToggles[stationId]
			const currentStoreState = mqttAreaData?.stations[stationId]?.status.state
			// If store still doesn't reflect the target state, we are still waiting
			const isTogglePending = targetState
				? currentStoreState !== targetState
				: false
			// Avoid memory leaks by cleaning up pending toggles
			if (targetState && currentStoreState === targetState) {
				setTimeout(() => {
					setPendingToggles((prev) => {
						if (!prev[stationId]) return prev
						const updated = { ...prev }
						delete updated[stationId]
						return updated
					})
				}, 0)
			}

			return isTypePending || isTogglePending
		},
		[
			currentScreenState.context.pendingStationTypeChange,
			mqttAreaData?.stations,
			pendingToggles,
		],
	)

	// Handler for setting the type of a station over MQTT
	// ESP publishes the new state back to the MQTT topic, store updates the UI
	const setTypeForAreaStation = useCallback(
		(areaKey: string, stationId: number, type: StationType) => {
			// Notify the state machine that a station type change is pending
			send({ type: 'SET_TYPE_STATION', stationId, newType: type })

			setTypeForAreaStationMqtt(areaKey, stationId, type)
		},
		[setTypeForAreaStationMqtt, send],
	)

	// Action button state management
	const isActionButtonDisabled = useCallback(
		(stationId: number, type: StationType, activeSolenoidId: number | null) => {
			if (!dbArea) return true
			if (isStationTypeChangePending(dbArea.key, stationId)) return true

			return (
				type === 'Unknown' ||
				(type === 'Solenoid' &&
					activeSolenoidId !== null &&
					activeSolenoidId !== stationId)
			)
		},
		[dbArea, isStationTypeChangePending],
	)

	// Sort the stations based on the stored order of IDs, appending any new stations at the end
	const listData = useMemo(() => {
		if (sortedStationIds.length === 0) return allStations

		// Map the stored order of IDs back to live, reactive station objects
		const stationMap = new Map(allStations.map((s) => [s.id, s]))
		const sorted = sortedStationIds
			.map((id) => stationMap.get(id))
			.filter((s): s is Station => s !== undefined)

		// Append any newly discovered stations that aren't in our sorted list yet
		const sortedSet = new Set(sortedStationIds)
		const extra = allStations.filter((s) => !sortedSet.has(s.id))

		return [...sorted, ...extra]
	}, [allStations, sortedStationIds])

	// Sticky bottom action buttons state management (Editing API area info)
	const isAreaUpdateButtonDisabled =
		!dbArea ||
		(areaFormState.name === '' && areaFormState.description === '') ||
		(areaFormState.name === dbArea.name &&
			areaFormState.location === dbArea.location &&
			areaFormState.description === dbArea.description)

	// Station render item for DraggableFlatList
	const renderItem = useCallback(
		({ item: station, drag, isActive }: RenderItemParams<Station>) => {
			if (!dbArea) return null

			const manualOverride = getManualOverrideForStation(dbArea.key, station.id)
			const espCountdown = manualOverride?.active
				? new Date(manualOverride.end ?? '').getTime() - Date.now()
				: undefined

			const activeSolenoidId = activeSolenoid?.id ?? null

			return (
				<StationCardItem
					station={station}
					isActive={isActive}
					isLoading={isStationLoading(station.id)}
					isActionDisabled={isActionButtonDisabled(
						station.id,
						station.type,
						activeSolenoidId,
					)}
					espCountdown={espCountdown}
					onDrag={drag}
					onActionPress={(durationMs: string) =>
						toggleStation(station.id, station.status.state, durationMs)
					}
					onTypeChange={(newType: StationType) =>
						setTypeForAreaStation(dbArea.key, station.id, newType)
					}
				/>
			)
		},
		[
			dbArea,
			activeSolenoid,
			isStationLoading,
			isActionButtonDisabled,
			toggleStation,
			setTypeForAreaStation,
			getManualOverrideForStation,
		],
	)

	// Loading
	if (currentScreenState.matches('loading')) {
		return <LoadingScreen label="Loading area..." />
	}

	// Failure
	if (currentScreenState.matches('failure')) {
		const error = currentScreenState.context.error
		const isRefreshing = currentScreenState.matches('loading')

		if (error?.code === 'MQTT_ERROR') {
			return (
				<StatusScreen
					variant="network-error"
					title="Live station data is unavailable"
					subtitle="Please try again later or check your broker connection."
					onRefresh={() => send({ type: 'RETRY_MQTT' })}
					isRefreshing={isRefreshing}
				/>
			)
		}

		return (
			<StatusScreen
				variant="network-error"
				title="Failed to load area"
				subtitle={error?.message ?? 'An error occurred while loading the area.'}
				onRefresh={() => send({ type: 'RETRY' })}
				isRefreshing={isRefreshing}
			/>
		)
	}

	// Empty
	if (currentScreenState.matches('empty')) {
		return (
			<StatusScreen
				variant="missing-data"
				title="No areas found"
				subtitle="Try adding one."
				onRefresh={() => send({ type: 'RETRY' })}
				isRefreshing={false}
			/>
		)
	}

	// Ready
	if (currentScreenState.matches('ready')) {
		if (!dbArea?.key) {
			return (
				<StatusScreen
					variant="missing-data"
					title="Area not found"
					subtitle="The requested area could not be found."
					onRefresh={() => send({ type: 'RETRY' })}
					isRefreshing={false}
				/>
			)
		}

		if (!isAreaOnline) {
			return (
				<StatusScreen
					variant="network-error"
					title="Area offline"
					subtitle="Broker reports this area is offline."
					onRefresh={() => send({ type: 'RETRY_MQTT' })}
					isRefreshing={false}
				/>
			)
		}

		// Normal area UI

		return (
			<>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<DraggableFlatList
						data={listData}
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderItem}
						ListHeaderComponent={
							<>
								<View
									style={{
										marginBottom: theme.space.x3l,
										gap: theme.space.x3l,
									}}
								>
									<AreaHeader
										area={dbArea}
										online={isAreaOnline}
										location={dbArea.location ?? 'Unknown Location'}
										lastUpdatedStr={lastUpdatedStr}
									/>
									<View>
										<Card flexDirection="column" elevation={0}>
											<AreaSummaryCardItem
												solenoidCount={solenoids.length}
												pumpCount={pumps.length}
												fertilizerCount={fertilizers.length}
												sensorCount={sensors.length}
												unclassifiedCount={unclassified.length}
											/>
										</Card>
										<Subtext
											text={`Last updated ${formatRelativeTime(lastUpdatedStr)}`}
										/>
									</View>
								</View>
								<SectionTitle text="Stations & Roles" />
							</>
						}
						ListFooterComponent={
							<View style={{ gap: theme.space.x2l }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.sm,
										marginVertical: theme.space.sm,
										paddingHorizontal: theme.space.sm,
									}}
								>
									<MaterialCommunityIcons
										name="information-variant-circle-outline"
										size={20}
										color={theme.colors.textMuted}
									/>
									<Text
										style={{
											color: theme.colors.textMuted,
											fontSize: 13,
											flex: 1,
										}}
									>
										Only one Solenoid can run at a time per area. Unclassified
										stations cannot be started until they are assigned a role.
										Hold down on a station to drag and reorder it in the list.
									</Text>
								</View>
								<View>
									<SectionTitle text="Edit Area Info" />
									<EditableAreaInfoCard
										name={areaFormState.name}
										description={areaFormState.description}
										onInfoChange={handleInfoChange}
									/>
								</View>
							</View>
						}
						ItemSeparatorComponent={() => (
							<View style={{ height: theme.space.lg }} />
						)}
						refreshControl={
							<RefreshControl
								refreshing={currentScreenState.matches('loading')}
								onRefresh={() => send({ type: 'RETRY' })}
							/>
						}
						contentContainerStyle={{
							paddingBottom: insets.bottom + theme.space.x3l,
							paddingTop: theme.space.lg,
							marginHorizontal: theme.space.md,
						}}
						onDragEnd={({ data }) => setSortedStationIds(data.map((s) => s.id))}
						removeClippedSubviews={false}
						windowSize={5}
					/>
				</GestureHandlerRootView>

				<StickyActionButtons
					disabled={
						currentScreenState.matches('loading') ||
						currentScreenState.matches('failure') ||
						isAreaUpdateButtonDisabled
					}
					onSave={() =>
						send({
							type: 'SAVE',
							payload: {
								key: dbArea.key,
								name: areaFormState.name || dbArea.name,
								location: areaFormState.location || dbArea.location,
								description: areaFormState.description || dbArea.description,
							},
						})
					}
					onDiscard={() => send({ type: 'DISCARD' })}
					isLoading={currentScreenState.matches('saving')}
					bottomInset={insets.bottom}
				/>
			</>
		)
	}
}
