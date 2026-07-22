import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMachine } from '@xstate/react'
import * as Burnt from 'burnt'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams } from 'expo-router'

import { EditableAreaInfoCard } from '@/components/areas/EditableAreaInfoCard'
import EditableStationCardItem from '@/components/areas/EditableStationCardItem'
import { STATION_TYPE_ICON } from '@/components/areas/StationCardItem'
import Card from '@/components/layout/Card'
import { StickyActionButtons } from '@/components/layout/StickyActionButtons'
import StatusScreen from '@/components/status/StatusScreen'
import Button from '@/components/ui/Button'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { RectangularMedia } from '@/components/ui/RectangularMedia'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { useAreaMqttData } from '@/hooks/useAreaMqttData'
import useStationAction from '@/hooks/useStationAction'
import useStationMqttUpdate from '@/hooks/useStationMqttUpdate'
import { currentScreenMachine } from '@/machines/currentScreenMachine'
import { areaFileUploadFn } from '@/mutations/storage'
import { AppError } from '@/types/api'
import { AreaUpdatePayload, Station, StationType } from '@/types/area'
import { FileUploadPayload, UploadAreaImageVariables } from '@/types/storage'
import resolveImageUrl from '@/utils/resolveImageUrl'

export default function EditAreaScreen() {
	const theme = useTheme()
	const queryClient = useQueryClient()
	const { key } = useLocalSearchParams() as { key: string }
	const insets = useSafeAreaInsets()
	const initializedRef = useRef(false)
	const [localAreaImage, setLocalAreaImage] = useState({
		uri: '',
		name: '',
		type: '',
	})

	// Local state (type omitted, changes instantly on picker change)
	const [areaFormState, setAreaFormState] = useState({
		friendlyName: '',
		locationLabel: '',
		locationCoordinates: '',
		description: '',
		imageUrl: '',
		stations: [
			{
				id: 0,
				type: 'Unknown' as StationType,
				name: '',
				description: '',
				imageUrl: '',
			},
		],
	})

	// Mutation for uploading area image to the API
	const { mutateAsync: uploadAreaImageAsync, isPending: isUploadingImage } =
		useMutation({
			mutationKey: [tanstackKeys.FILE_UPLOAD, key],
			mutationFn: ({ payload, areaId }: UploadAreaImageVariables) =>
				areaFileUploadFn(payload, areaId),
			onError: (error: AppError) => {
				Burnt.toast({
					title:
						error.code === 'UNKNOWN_ERROR'
							? 'Image upload failed'
							: error.message,
					preset: 'error',
				})
			},
			onSuccess: (data) => {
				console.log('Area image uploaded successfully:', data)
				setAreaFormState((prev) => ({
					...prev,
					imageUrl: data.fileUrl,
				}))
			},
		})

	// State machine for managing screen states
	const [currentScreenState, send] = useMachine(
		currentScreenMachine.provide({
			actions: {
				// Sync area state from store to local state when the machine enters
				// the "ready" state (API data only)
				syncAreaState: ({ context }) => {
					if (!context.areas) return
					const area = context.areas.find((a) => a.key === key)
					if (area) {
						setAreaFormState((prev) => ({
							...prev,
							friendlyName: area.friendlyName || '',
							locationLabel: area.locationLabel || '',
							locationCoordinates: area.locationCoordinates || '',
							description: area.description || '',
							imageUrl: area.imageUrl || '',
						}))
						console.log('areaFormState synced to API data:', areaFormState)
					}
				},
				// Reset area state to the last known values from the store when
				// discarding changes (API data only)
				resetAreaState: ({ context }) => {
					if (!context.areas) return
					const area = context.areas.find((a) => a.key === key)
					if (area) {
						setAreaFormState((prev) => ({
							...prev,
							friendlyName: area.friendlyName || '',
							locationLabel: area.locationLabel || '',
							locationCoordinates: area.locationCoordinates || '',
							description: area.description || '',
							imageUrl: area.imageUrl || '',
						}))
					} else {
						// fallback: clear the form
						setAreaFormState((prev) => ({
							...prev,
							friendlyName: '',
							location: '',
							description: '',
							imageUrl: '',
						}))
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
	const {
		areas: dbAreas,
		pendingSave,
		pendingStationTypeChange,
		pendingStationNameChange,
		pendingStationDescriptionChange,
		pendingStationImageUrlChange,
	} = currentScreenState.context
	const dbArea = useMemo(
		() => dbAreas?.find((a) => a.key === key),
		[dbAreas, key],
	)

	const changeSet = useMemo(() => {
		return new Map<string, Record<number, string | undefined>>([
			['type', pendingStationTypeChange],
			['name', pendingStationNameChange],
			['description', pendingStationDescriptionChange],
			['imageUrl', pendingStationImageUrlChange],
		])
	}, [
		pendingStationTypeChange,
		pendingStationNameChange,
		pendingStationDescriptionChange,
		pendingStationImageUrlChange,
	])

	// Store derived area state (MQTT data)
	const { allStations, isAreaOnline, manualOverrides, sortStations } =
		useAreaMqttData(key)

	const { isStationActionPending } = useStationAction(
		key,
		send,
		currentScreenState.context.pendingStationActions,
	)

	// Store derived setter functions for station updates via MQTT (adds pending
	// changes to the state machine context)
	const { setNewValueForStation } = useStationMqttUpdate(key, changeSet, send)

	// Handler for reordering stations
	const handleStationReorder = (stationIds: number[]) => {
		sortStations(key, stationIds)
	}

	// Fills station draft state from live MQTT data. Used both for the initial
	// one-time load and for resetting drafts on discard.
	const resetStationDrafts = useCallback(() => {
		if (!dbArea) return
		setAreaFormState((prev) => ({
			...prev,
			stations: allStations.map((station) => ({
				id: station.id,
				type: station.type,
				name: station.name || '',
				description: station.description || '',
				imageUrl: station.imageUrl || '',
			})),
		}))
	}, [dbArea, allStations])

	// Fills area draft state from API data. Used only for initial load
	// (machine handles discard)
	const loadAreaDrafts = useCallback(() => {
		if (!dbArea) return
		setAreaFormState((prev) => ({
			...prev,
			friendlyName: dbArea.friendlyName || '',
			locationLabel: dbArea.locationLabel || '',
			locationCoordinates: dbArea.locationCoordinates || '',
			description: dbArea.description || '',
			imageUrl: dbArea.imageUrl || '',
		}))
		console.log(
			'loadAreaDrafts: areaFormState loaded from API data:',
			areaFormState,
		)
	}, [dbArea, areaFormState])

	// Seed station drafts once on load. Guarded so live MQTT updates afterward
	// don't overwrite in-progress edits.
	useEffect(() => {
		if (initializedRef.current) return
		if (!dbArea) return
		console.log(dbArea.imageUrl, 'dbArea.imageUrl')
		initializedRef.current = true
		queueMicrotask(() => {
			resetStationDrafts()
			loadAreaDrafts()
		})
	}, [dbArea, resetStationDrafts, loadAreaDrafts])

	// Handler for updating station data in local state when the user edits a field
	const handleStationDataChange = useCallback(
		(
			field: 'type' | 'name' | 'description' | 'imageUrl',
			stationId: number,
			newValue: string,
		) => {
			console.log(
				`handleStationDataChange: field=${field}, stationId=${stationId}, newValue=${newValue}`,
			)
			setAreaFormState((prev) => ({
				...prev,
				stations: prev.stations.map((station) =>
					station.id === stationId
						? { ...station, [field]: newValue }
						: station,
				),
			}))
		},
		[],
	)

	// Handler for saving changes to the API and MQTT
	const handleSave = async () => {
		if (!dbArea) return

		let finalImageUrl = areaFormState.imageUrl
		console.log('handleSave: areaFormState:', areaFormState)

		// Upload selected area image to the API if it has changed before saving DB state
		if (localAreaImage.uri && localAreaImage.uri !== dbArea.imageUrl) {
			try {
				const uploadResult = await uploadAreaImageAsync({
					payload: {
						uri: localAreaImage.uri,
						name: localAreaImage.name,
						type: localAreaImage.type,
					} as FileUploadPayload,
					areaId: dbArea.id,
				})
				finalImageUrl = uploadResult.fileUrl
			} catch {
				// Image upload failed, halt save flow so DB payload isn't out of sync
				return
			}
		}

		const apiPayload: Partial<AreaUpdatePayload> = {
			id: dbArea.id,
			friendlyName: areaFormState.friendlyName ?? undefined,
			locationLabel: areaFormState.locationLabel ?? undefined,
			locationCoordinates: areaFormState.locationCoordinates ?? undefined,
			description: areaFormState.description ?? undefined,
			imageUrl: finalImageUrl ?? undefined,
		}

		// Fire MQTT commits first, so pending maps are populated before syncingDevice
		areaFormState.stations.forEach((draftStation) => {
			const liveStation = allStations.find((s) => s.id === draftStation.id)
			if (!liveStation) return
			;(['type', 'name', 'description', 'imageUrl'] as const).forEach(
				(field) => {
					const draftValue = draftStation[field] ?? ''
					const liveValue = liveStation[field] ?? ''
					if (draftValue !== liveValue) {
						setNewValueForStation(draftStation.id, field, draftValue)
					}
				},
			)
		})

		// Then trigger the DB save -> saving -> syncingDevice -> ready
		send({ type: 'SAVE', payload: apiPayload })
	}

	// Handler for discarding changes and resetting local state to the last known
	// values (API and MQTT)
	const handleDiscard = () => {
		loadAreaDrafts()
		send({ type: 'DISCARD' })
	}

	// Handle add/edit area image press. Opens the image picker and updates local draft state.
	const handleChooseImage = async () => {
		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: 'images',
				allowsEditing: true,
				aspect: [16, 9],
				quality: 0.8,
			})

			if (!result.canceled && result.assets.length > 0) {
				if (result.assets.length > 1) {
					Burnt.alert({
						title: 'Multiple Images Selected',
						message: 'Please select only one image.',
					})
					return
				}

				const asset = result.assets[0]
				const imageUri = asset.uri

				// Derive valid filename and complete MIME type for React Native FormData
				const filename =
					asset.fileName || imageUri.split('/').pop() || 'area_image.jpg'
				const mimeType = asset.mimeType || 'image/jpeg'

				setLocalAreaImage({
					uri: imageUri,
					name: filename,
					type: mimeType,
				})

				setAreaFormState((prev) => ({
					...prev,
					imageUrl: imageUri,
				}))
			} else {
				Burnt.alert({
					title: 'Image Selection Canceled',
					message: 'No image was selected.',
				})
			}
		} catch (error) {
			console.error('Error picking image:', error)
			Burnt.alert({
				title: 'Image Selection Error',
				message:
					'An error occurred while selecting the image. Please try again.',
			})
		}
	}

	// Determine if the save button should be disabled (no changes, or a save/sync already in flight)
	const isButtonDisabled = useMemo(() => {
		if (!dbArea) return true

		const hasPendingStationAction = allStations.some((station) =>
			isStationActionPending(station.id),
		)
		const hasPendingChange = [
			pendingStationTypeChange,
			pendingStationNameChange,
			pendingStationDescriptionChange,
			pendingStationImageUrlChange,
		].some((changeMap) => Object.values(changeMap).some((v) => v !== undefined))

		if (hasPendingStationAction || hasPendingChange || pendingSave) {
			return true
		}

		const hasAreaFieldChanged =
			areaFormState.friendlyName !== dbArea.friendlyName ||
			areaFormState.locationLabel !== dbArea.locationLabel ||
			areaFormState.locationCoordinates !== dbArea.locationCoordinates ||
			areaFormState.description !== dbArea.description ||
			areaFormState.imageUrl !== dbArea.imageUrl

		const hasStationFieldChanged = areaFormState.stations.some(
			(draftStation) => {
				const liveStation = allStations.find((s) => s.id === draftStation.id)
				if (!liveStation) return false
				return (
					draftStation.name !== liveStation.name ||
					draftStation.description !== liveStation.description ||
					draftStation.imageUrl !== liveStation.imageUrl
				)
			},
		)

		return !(hasAreaFieldChanged || hasStationFieldChanged)
	}, [
		dbArea,
		allStations,
		pendingSave,
		pendingStationTypeChange,
		pendingStationNameChange,
		pendingStationDescriptionChange,
		pendingStationImageUrlChange,
		areaFormState,
		isStationActionPending,
	])

	// API specific editable data
	const renderApiEditableData = useCallback(
		(apiOnly = false) => {
			if (!dbArea) return null

			// Helper to determine active display URI
			const displayUri = resolveImageUrl(localAreaImage.uri || dbArea.imageUrl)

			return (
				<View style={{ flex: 1 }}>
					<View>
						<SectionTitle text="Edit area image" />
						<RectangularMedia
							aspectRatio={16 / 9}
							isFullWidth
							ringColor={theme.colors.border}
							elevation={0}
						>
							{displayUri ? (
								<Image
									source={{ uri: displayUri }}
									style={StyleSheet.absoluteFill}
									resizeMode="cover"
									onError={(e) =>
										console.log(
											'Failed to load image from URI:',
											displayUri,
											e.nativeEvent.error,
										)
									}
								/>
							) : (
								<View
									style={[
										StyleSheet.absoluteFill,
										{
											backgroundColor: theme.colors.accentBlue + '15',
											justifyContent: 'center',
											alignItems: 'center',
											gap: 8,
										},
									]}
								>
									<View
										style={{
											borderRadius: 0,
											justifyContent: 'center',
											alignItems: 'center',
											flexDirection: 'row',
											gap: theme.space.sm,
										}}
									>
										<MaterialCommunityIcons
											name="file-image-plus"
											size={24}
											color={theme.colors.textPrimary}
										/>
										<Text
											style={{
												fontSize: theme.font.sm + 2,
												fontWeight: '500',
												color: theme.colors.textPrimary,
											}}
										>
											Add area image
										</Text>
									</View>
								</View>
							)}

							{isUploadingImage && (
								<View
									style={[
										StyleSheet.absoluteFill,
										{
											backgroundColor: theme.colors.card,
											justifyContent: 'center',
											alignItems: 'center',
											gap: theme.space.sm,
										},
									]}
								>
									<ActivityIndicator
										color={theme.colors.accentBlue}
										size="large"
									/>
									<Text
										style={{
											fontSize: theme.font.sm + 2,
											fontWeight: '500',
											color: theme.colors.textPrimary,
										}}
									>
										Uploading...
									</Text>
								</View>
							)}
						</RectangularMedia>
						<Button
							icon="image-edit"
							label="Change Image"
							variant="secondary"
							modifier={['small']}
							onPress={handleChooseImage}
							extraStyles={{ position: 'absolute', bottom: 8, right: 8 }}
						/>
					</View>
					<View style={{ marginVertical: theme.space.x2l }} />
					<SectionTitle text="Edit Area" />
					<EditableAreaInfoCard
						friendlyName={areaFormState.friendlyName}
						locationLabel={areaFormState.locationLabel}
						locationCoordinates={areaFormState.locationCoordinates}
						description={areaFormState.description}
						onInfoChange={(field, newValue) => {
							setAreaFormState((prev) => ({ ...prev, [field]: newValue }))
						}}
					/>
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
								MQTT data is unavailable. Only API editable data is shown.
								Ensure the{' '}
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
		[dbArea, areaFormState, theme.colors, theme.font, theme.space],
	)

	// Station render item for DraggableFlatList
	const renderStation = useCallback(
		({ item: station, drag, isActive }: RenderItemParams<Station>) => {
			if (!dbArea) return null

			const manualOverride = manualOverrides(dbArea.key, station.id)
			// The ESP always publishes the state of manual overrides
			if (!manualOverride) return null
			const isTypeChangePending = !!pendingStationTypeChange[station.id]
			const isStationLoading =
				isTypeChangePending || isStationActionPending(station.id)
			const localStateMatch = areaFormState.stations.find(
				(s) => s.id === station.id,
			)

			return (
				<ScaleDecorator>
					{/* 
            Baking the spacing directly into the item container. This ensures
						the spacer scales and animates atomically with the card, removing
						layout recalculation pops.
          */}
					<View style={{ marginBottom: theme.space.md }}>
						<Card>
							<EditableStationCardItem
								station={station}
								isActive={isActive}
								isLoading={isStationLoading}
								manualOverride={manualOverride}
								onDrag={drag}
								onDataChange={handleStationDataChange}
								isMqttEditable={isAreaOnline}
								newLeadingIcon={
									localStateMatch?.type === 'Solenoid'
										? STATION_TYPE_ICON.Solenoid
										: localStateMatch?.type === 'Pump'
											? STATION_TYPE_ICON.Pump
											: localStateMatch?.type === 'Fertilizer'
												? STATION_TYPE_ICON.Fertilizer
												: STATION_TYPE_ICON.Unknown
								}
							/>
						</Card>
					</View>
				</ScaleDecorator>
			)
		},
		[
			dbArea,
			isAreaOnline,
			manualOverrides,
			isStationActionPending,
			pendingStationTypeChange,
			handleStationDataChange,
			theme.space.md,
			areaFormState.stations,
		],
	)

	// Loading
	if (currentScreenState.matches('loading')) {
		return <LoadingScreen label="Loading area..." />
	}

	// Waiting on MQTT data, but DB data is available
	if (currentScreenState.matches('requestMqttData')) {
		if (!dbArea?.key) {
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
				<SectionTitle text="Edit area image" />
				<LoadingScreen label="Connecting to MQTT..." />
			</ScrollView>
		)
	}

	// Saving
	if (currentScreenState.matches('saving')) {
		return <LoadingScreen label="Saving changes..." />
	}

	// Syncing device
	if (currentScreenState.matches('syncingDevice')) {
		return <LoadingScreen label="Syncing changes to device..." />
	}

	// Failure
	if (currentScreenState.matches('failure')) {
		const error = currentScreenState.context.error
		const isRefreshing = currentScreenState.matches('loading')

		// On MQTT error, show API editable data as fallback if available
		if (error?.code === 'MQTT_ERROR') {
			return (
				<>
					<View style={{ flex: 1 }}>
						<ScrollView
							refreshControl={
								<RefreshControl
									refreshing={currentScreenState.matches('loading')}
									onRefresh={() => send({ type: 'RETRY' })}
									progressViewOffset={theme.space.xl}
									colors={[theme.colors.accentBlue]}
								/>
							}
							contentContainerStyle={{
								paddingTop: theme.space.x3l,
								paddingBottom: insets.bottom + theme.space.x3l,
								marginHorizontal: theme.space.md,
							}}
						>
							{renderApiEditableData(true)}
						</ScrollView>
					</View>
					<StickyActionButtons
						disabled={isButtonDisabled}
						onSave={handleSave}
						onDiscard={handleDiscard}
						isLoading={
							currentScreenState.matches('saving') ||
							currentScreenState.matches('syncingDevice')
						}
						bottomInset={insets.bottom}
					/>
				</>
			)
		}

		// Fallback for NETWORK_ERROR, DEVICE_FETCH_FAILED, UNKNOWN_ERROR, etc.
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

	// Ready
	if (currentScreenState.matches('ready')) {
		if (!dbArea?.key) {
			console.log('Area not found for key:', key)
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
				<>
					<View style={{ flex: 1 }}>
						<ScrollView
							refreshControl={
								<RefreshControl
									refreshing={currentScreenState.matches('loading')}
									onRefresh={() => send({ type: 'RETRY' })}
									progressViewOffset={theme.space.xl}
									colors={[theme.colors.accentBlue]}
								/>
							}
							contentContainerStyle={{
								paddingTop: theme.space.x3l,
								paddingBottom: insets.bottom + theme.space.x3l,
								marginHorizontal: theme.space.md,
							}}
						>
							{renderApiEditableData(true)}
						</ScrollView>
					</View>
					<StickyActionButtons
						disabled={isButtonDisabled}
						onSave={handleSave}
						onDiscard={handleDiscard}
						isLoading={
							currentScreenState.matches('saving') ||
							currentScreenState.matches('syncingDevice')
						}
						bottomInset={insets.bottom}
					/>
				</>
			)
		}

		// Normal area UI
		return (
			<>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<DraggableFlatList
						data={allStations}
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderStation}
						ListHeaderComponent={
							<>
								{renderApiEditableData()}
								<View style={{ marginVertical: theme.space.x2l }} />
								<SectionTitle text="Edit stations" />
							</>
						}
						ListFooterComponent={
							<View style={{ gap: theme.space.x2l }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.md,
										marginVertical: theme.space.sm,
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
											fontSize: theme.font.sm,
										}}
									>
										Hold and drag stations up or down to set their order. Use
										the picker to set the role of a station. There can only ever
										be one solenoid active at a time.
									</Text>
								</View>
							</View>
						}
						refreshControl={
							<RefreshControl
								refreshing={currentScreenState.matches('loading')}
								onRefresh={() => send({ type: 'RETRY' })}
								progressViewOffset={theme.space.xl}
								colors={[theme.colors.accentBlue]}
							/>
						}
						contentContainerStyle={{
							paddingTop: theme.space.x3l,
							paddingBottom: insets.bottom + theme.space.x3l,
							marginHorizontal: theme.space.md,
						}}
						onDragEnd={({ data }) =>
							handleStationReorder(data.map((s) => s.id))
						}
						removeClippedSubviews={false}
						windowSize={5}
					/>
				</GestureHandlerRootView>
				<StickyActionButtons
					disabled={isButtonDisabled}
					onSave={handleSave}
					onDiscard={handleDiscard}
					isLoading={
						currentScreenState.matches('saving') ||
						currentScreenState.matches('syncingDevice')
					}
					bottomInset={insets.bottom}
				/>
			</>
		)
	}
}
