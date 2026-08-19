import { useCallback, useEffect, useMemo } from 'react'
import { Dimensions, RefreshControl, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMachine } from '@xstate/react'
import { useLocalSearchParams } from 'expo-router'

import AreaHeader from '@/components/areas/AreaHeader'
import StationCardItem from '@/components/areas/StationCardItem'
import Card from '@/components/layout/Card'
import ScrollView from '@/components/layout/ScrollView'
import StatusScreen from '@/components/status/StatusScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { useAreaMqttData } from '@/hooks/useAreaMqttData'
import useStationAction from '@/hooks/useStationAction'
import { currentScreenMachine } from '@/machines/currentScreenMachine'
import { areasQueryFn } from '@/queries/areas'
import { useHeaderStore } from '@/stores/headerStore'
import { Station, StationAction } from '@/types/area'

export default function AreaInfoScreen() {
	const theme = useTheme()
	const queryClient = useQueryClient()
	const { key } = useLocalSearchParams() as { key: string }
	const setAreaHeaderOpacity = useHeaderStore(
		(state) => state.setAreaHeaderOpacity,
	)

	// The hero image is 16:9 full-bleed; the header fades in as you scroll past it.
	const heroHeight = (Dimensions.get('window').width * 9) / 16

	const handleScroll = useCallback(
		(event: { nativeEvent: { contentOffset: { y: number } } }) => {
			const y = event.nativeEvent.contentOffset.y
			const opacity = Math.min(1, Math.max(0, y / heroHeight))
			setAreaHeaderOpacity(opacity)
		},
		[setAreaHeaderOpacity, heroHeight],
	)

	// Reset the header to transparent when the screen unmounts.
	useEffect(() => {
		return () => setAreaHeaderOpacity(0)
	}, [setAreaHeaderOpacity])

	// State machine for managing screen states
	const [currentScreenState, send] = useMachine(
		currentScreenMachine.provide({}),
		{
			input: { queryClient, mqtt: useMqtt() },
		},
	)

	// State machine derived area state (API data)
	const {
		areas: dbAreas,
		pendingStationTypeChange,
		pendingStationNameChange,
	} = currentScreenState.context
	// Subscribe to the shared areas cache so this screen reflects server-side
	// changes (e.g. renames saved on the edit screen) while it stays mounted.
	// The machine context is a snapshot and doesn't update on its own.
	const { data: liveAreas } = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})
	const dbArea = useMemo(
		() =>
			liveAreas?.find((a) => a.key === key) ??
			dbAreas?.find((a) => a.key === key),
		[liveAreas, dbAreas, key],
	)
	// Store derived area state (MQTT data)
	const { allStations, isAreaOnline, isUpdating, manualOverrides } =
		useAreaMqttData(key)

	const {
		isActionButtonDisabled,
		isStationActionPending,
		initiateStationAction,
	} = useStationAction(
		key,
		send,
		currentScreenState.context.pendingStationActions,
	)

	// Toggle station action (start/stop) based on the button that was pressed.
	const toggleAction = useCallback(
		(stationId: number, action: 'Start' | 'Stop', durationMs: number) => {
			const newAction: StationAction = {
				action,
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
				<>
					<AreaHeader
						dbArea={dbArea}
						online={isAreaOnline}
						updating={isUpdating}
					/>
					{apiOnly ? (
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: theme.space.sm,
								paddingHorizontal: theme.space.sm,
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
								Live data is unavailable. Only API data is shown. Ensure your
								Hydrolink is powered on and connected to the network. Pull to
								refresh.
							</Text>
						</View>
					) : null}
				</>
			)
		},
		[
			dbArea,
			isAreaOnline,
			isUpdating,
			theme.colors.textMuted,
			theme.font.xs,
			theme.space.sm,
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
			if (!manualOverride) return null

			// Merge optimistic/pending changes so the UI reflects a save
			// immediately, instead of waiting for the device to echo it back.
			const pendingName = pendingStationNameChange[station.id]
			const mergedStation =
				pendingName !== undefined ? { ...station, name: pendingName } : station

			return (
				<Card key={station.id}>
					<StationCardItem
						station={mergedStation}
						isActionDisabled={isActionButtonDisabled(station.id)}
						isLoading={isStationLoading}
						manualOverride={manualOverride}
						onActionPress={(action, durationMs) =>
							toggleAction(station.id, action, durationMs)
						}
						isActive={station.status.state === 'Running'}
					/>
				</Card>
			)
		},
		[
			dbArea,
			pendingStationTypeChange,
			pendingStationNameChange,
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
							colors={[theme.colors.accent, theme.colors.background]}
						/>
					}
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
				hint="Only local area features are available."
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
				hint="Only local area features are available."
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
				flexDirection="column"
				refreshControl={
					<RefreshControl
						refreshing={currentScreenState.matches('loading')}
						onRefresh={() => send({ type: 'RETRY' })}
						progressViewOffset={theme.space.x3l}
						colors={[theme.colors.accent, theme.colors.background]}
					/>
				}
			>
				<View
					style={{
						marginBottom: theme.space.x3l,
						gap: theme.space.x3l,
					}}
				>
					<AreaHeader
						dbArea={dbArea}
						online={isAreaOnline}
						updating={isUpdating}
					/>
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
					subtitle="The requested area couldn't be found."
					hint="Only local area features are available."
					onRefresh={() => send({ type: 'RETRY' })}
					isRefreshing={false}
				/>
			)
		}

		// Area is offline, show API data only
		if (!isAreaOnline) {
			return (
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={currentScreenState.matches('loading')}
							onRefresh={() => send({ type: 'RETRY' })}
							progressViewOffset={theme.space.x3l}
							colors={[theme.colors.accent, theme.colors.background]}
						/>
					}
				>
					{renderApiData()}
					<View style={{ gap: theme.space.x2l }}>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								gap: theme.space.sm,
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
				onScroll={handleScroll}
				scrollEventThrottle={16}
				refreshControl={
					<RefreshControl
						refreshing={currentScreenState.matches('loading')}
						onRefresh={() => send({ type: 'RETRY' })}
						progressViewOffset={theme.space.x3l}
						colors={[theme.colors.accent, theme.colors.background]}
					/>
				}
			>
				{renderApiData()}
				<View style={{ gap: theme.space.lg }}>
					<SectionTitle text="Stations & Roles" style={{ marginBottom: 0 }} />
					{allStations.map((station) => (
						<View key={`station-${station.id}`}>{renderStation(station)}</View>
					))}
				</View>

				<View style={{ gap: theme.space.x2l }}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.space.sm,
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
