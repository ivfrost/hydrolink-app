import { useCallback, useEffect, useMemo } from 'react'
import { RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useMachine } from '@xstate/react'
import { useLocalSearchParams } from 'expo-router'

import AreaHeader from '@/components/areas/AreaHeader'
import AreaSummaryCard from '@/components/areas/AreaSummaryCard'
import StationCardItem from '@/components/areas/StationCardItem'
import Card from '@/components/layout/Card'
import StatusScreen from '@/components/status/StatusScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { useAreaMqttData } from '@/hooks/useAreaMqttData'
import useStationAction from '@/hooks/useStationAction'
import { currentScreenMachine } from '@/machines/currentScreenMachine'
import { Station, StationAction, StationStatus } from '@/types/area'

export default function AreaInfoScreen() {
	const theme = useTheme()
	const queryClient = useQueryClient()
	const { key } = useLocalSearchParams() as { key: string }
	const insets = useSafeAreaInsets()

	// State machine for managing screen states
	const [currentScreenState, send] = useMachine(
		currentScreenMachine.provide({}),
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
	// Store derived area state (MQTT data)
	const {
		allStations,
		solenoids,
		pumps,
		fertilizers,
		sensors,
		unclassified,
		isAreaOnline,
		lastUpdatedStr,
		manualOverrides,
	} = useAreaMqttData(key)

	const {
		isActionButtonDisabled,
		isStationActionPending,
		initiateStationAction,
	} = useStationAction(
		key,
		send,
		currentScreenState.context.pendingStationActions,
	)

	// Toggle station action (start/stop) based on current state
	const toggleAction = useCallback(
		(
			stationId: number,
			currentState: StationStatus['state'],
			durationMs: number,
		) => {
			console.log(`Current state of station ${stationId}: ${currentState}`)
			console.log(
				`Next state of station ${stationId}: ${currentState === 'Running' ? 'Idle' : 'Running'}`,
			)
			console.log(
				`Next action of station ${stationId}: ${currentState === 'Running' ? 'Stop' : 'Start'}`,
			)

			const newAction: StationAction = {
				action: currentState === 'Running' ? 'Stop' : 'Start',
				cause: 'Manual',
				durationMs,
			}

			initiateStationAction(stationId, newAction)
		},
		[initiateStationAction],
	)
	// Effect to listen for MQTT store updates and clear pending actions in XState
	useEffect(() => {
		if (!allStations) return

		const pendingActions = currentScreenState.context.pendingStationActions

		// Only run if we actually have pending actions waiting to be confirmed
		if (Object.keys(pendingActions).length === 0) return

		allStations.forEach((station) => {
			const pending = pendingActions[station.id]

			// Only dispatch confirmation if this station has a pending action
			if (pending && pending.targetState === station.status.state) {
				send({
					type: 'STATION_STATE_CONFIRMED',
					stationId: station.id,
					state: station.status.state,
				})
			}
		})
	}, [allStations, currentScreenState.context.pendingStationActions, send])

	// API specific data rendering
	const renderApiData = useCallback(
		(apiOnly = false) => {
			if (!dbArea) return null

			return (
				<View
					style={{
						marginBottom: theme.space.x2l,
					}}
				>
					<AreaHeader dbArea={dbArea} online={isAreaOnline} />
					{apiOnly ? (
						<View
							style={{
								flexDirection: 'row',
								marginHorizontal: theme.space.sm,
								alignItems: 'center',
								gap: theme.space.sm,
								marginVertical: theme.space.sm,
							}}
						>
							<MaterialCommunityIcons
								name="information-variant-circle-outline"
								size={16}
								color={theme.colors.textMuted}
							/>
							<Text
								style={{
									flex: 1,
									color: theme.colors.textMuted,
									fontSize: theme.font.xs,
								}}
							>
								Live data is unavailable. Only API data is shown. Ensure the{' '}
								<Text
									style={{
										fontVariant: ['small-caps'],
										color: theme.colors.textMuted,
										fontWeight: '500',
									}}
								>
									Hydrolink
								</Text>{' '}
								is powered on and connected to the network. Pull to refresh.
							</Text>
						</View>
					) : null}
				</View>
			)
		},
		[
			dbArea,
			isAreaOnline,
			theme.colors.textMuted,
			theme.space.sm,
			theme.space.x2l,
			theme.font.xs,
		],
	)

	// Station render item (display only, drag to reorder on edit screen)
	const renderStation = useCallback(
		(station: Station) => {
			if (!dbArea) return null
			const isTypeChangePending = !!pendingStationTypeChange[station.id]
			const isStationLoading =
				isTypeChangePending || isStationActionPending(station.id)

			const manualOverride = manualOverrides(dbArea.key, station.id)
			// The ESP always publishes the state of manual overrides
			if (!manualOverride) return null

			return (
				<Card key={station.id}>
					<StationCardItem
						station={station}
						isActionDisabled={isActionButtonDisabled(station.id)}
						isLoading={isStationLoading}
						manualOverride={manualOverride}
						onActionPress={(durationMs: number) =>
							toggleAction(station.id, station.status.state, durationMs)
						}
						isActive={station.status.state === 'Running'}
					/>
				</Card>
			)
		},
		[
			dbArea,
			pendingStationTypeChange,
			isStationActionPending,
			isActionButtonDisabled,
			toggleAction,
			manualOverrides,
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

		// On MQTT error, show API data as fallback if available
		if (error?.code === 'MQTT_ERROR') {
			return (
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={currentScreenState.matches('loading')}
							onRefresh={() => send({ type: 'RETRY' })}
							progressViewOffset={theme.space.x3l}
							colors={[theme.colors.accentBlue]}
						/>
					}
					contentContainerStyle={{
						paddingTop: theme.space.x3l,
						paddingBottom: insets.bottom + theme.space.x3l,
						marginHorizontal: theme.space.md,
					}}
				>
					{renderApiData(true)}
				</ScrollView>
			)
		}

		// Fallback for any other error
		return (
			<StatusScreen
				variant="network-error"
				title="Something went wrong"
				subtitle={error?.message ?? 'Please try again.'}
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

	// Waiting on MQTT data, but DB data is available
	if (currentScreenState.matches('requestMqttData')) {
		if (!dbArea?.key) {
			// Shouldn't normally happen (areas came from a prior successful step),
			return <LoadingScreen label="Loading area..." />
		}

		return (
			<ScrollView
				contentContainerStyle={{
					paddingTop: theme.space.x3l,
					paddingBottom: insets.bottom + theme.space.x3l,
					marginHorizontal: theme.space.md,
				}}
			>
				<View
					style={{
						marginBottom: theme.space.x3l,
						gap: theme.space.x3l,
					}}
				>
					<AreaHeader dbArea={dbArea} online={isAreaOnline} />
				</View>
				<SectionTitle text="Stations & Roles" />
				<LoadingScreen label="Connecting to MQTT..." />
			</ScrollView>
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
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={currentScreenState.matches('loading')}
							onRefresh={() => send({ type: 'RETRY' })}
							progressViewOffset={theme.space.x3l}
							colors={[theme.colors.accentBlue]}
						/>
					}
					contentContainerStyle={{
						paddingTop: theme.space.x3l,
						paddingBottom: insets.bottom + theme.space.x3l,
						marginHorizontal: theme.space.md,
					}}
				>
					{renderApiData()}
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
									fontSize: theme.font.xs,
									flex: 1,
								}}
							>
								The area is currently offline. Ensure the{' '}
								<Text
									style={{
										fontVariant: ['small-caps'],
										color: theme.colors.textMuted,
										fontWeight: '500',
									}}
								>
									Hydrolink
								</Text>{' '}
								is powered on and its connectivity is configured correctly. Pull
								to refresh.
							</Text>
						</View>
					</View>
				</ScrollView>
			)
		}

		// Normal area UI
		return (
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={currentScreenState.matches('loading')}
						onRefresh={() => send({ type: 'RETRY' })}
						progressViewOffset={theme.space.x3l}
						colors={[theme.colors.accentBlue]}
					/>
				}
				contentContainerStyle={{
					paddingTop: theme.space.x3l,
					paddingBottom: insets.bottom + theme.space.x3l,
					marginHorizontal: theme.space.md,
				}}
			>
				{renderApiData()}
				<AreaSummaryCard
					solenoidCount={solenoids.length}
					pumpCount={pumps.length}
					fertilizerCount={fertilizers.length}
					sensorCount={sensors.length}
					unclassifiedCount={unclassified.length}
					lastUpdatedStr={lastUpdatedStr}
				/>
				<View style={{ marginVertical: theme.space.xl }} />
				<SectionTitle text="Stations & Roles" />

				{allStations.map((station, idx) => (
					<View key={`station-${station.id}`}>
						{renderStation(station)}
						{idx < allStations.length - 1 && (
							<View
								style={{
									height: theme.space.md,
								}}
							/>
						)}
					</View>
				))}

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
								fontSize: theme.font.xs,
								flex: 1,
							}}
						>
							Only one Solenoid can run at a time per area. Unclassified
							stations cannot be started until they are assigned a role.
						</Text>
					</View>
				</View>
			</ScrollView>
		)
	}
}
