import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMachine } from '@xstate/react'
import * as Burnt from 'burnt'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { EditableAreaInfoCard } from '@/components/areas/EditableAreaInfoCard'
import EditableStationCardItem from '@/components/areas/EditableStationCardItem'
import { STATION_TYPE_ICON } from '@/components/areas/StationCardItem'
import Card from '@/components/layout/Card'
import ScrollView from '@/components/layout/ScrollView'
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
import { areaUpdateMutationFn } from '@/mutations/areas'
import { areaFileUploadFn } from '@/mutations/storage'
import { AppError } from '@/types/api'
import { AreaUpdatePayload, Station, StationType } from '@/types/area'
import { FileUploadPayload, UploadAreaImageVariables } from '@/types/storage'
import resolveImageUrl from '@/utils/resolveImageUrl'

export default function EditAreaScreen() {
	const theme = useTheme()
	const queryClient = useQueryClient()
	const { key } = useLocalSearchParams() as { key: string }
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const initializedRef = useRef(false)
	const [localAreaImage, setLocalAreaImage] = useState({
		uri: '',
		name: '',
		type: '',
	})
	const [confirmingField, setConfirmingField] = useState<string | null>(null)

	// Baseline of the last successfully saved area info fields, used to know
	// when a field's inline confirm button should disappear.
	const [savedAreaValues, setSavedAreaValues] = useState({
		friendlyName: '',
		locationLabel: '',
		description: '',
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
				type: 'Unclassified' as StationType,
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
				setAreaFormState((prev) => ({
					...prev,
					imageUrl: resolveImageUrl(data.fileUrl) || data.fileUrl,
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
						setSavedAreaValues({
							friendlyName: area.friendlyName || '',
							locationLabel: area.locationLabel || '',
							description: area.description || '',
						})
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
				name: station.name || 'Station ' + (station.id + 1),
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
	}, [dbArea, areaFormState])

	// Seed station drafts once on load. Guarded so live MQTT updates afterward
	// don't overwrite in-progress edits.
	useEffect(() => {
		if (initializedRef.current) return
		if (!dbArea) return
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

	const handleFieldConfirm = async (field: string, value: string) => {
		if (!dbArea) return
		setConfirmingField(field)
		try {
			await areaUpdateMutationFn({
				key: dbArea.key,
				[field]: value,
			} as Partial<AreaUpdatePayload>)
			// Update the baseline so the confirm button disappears immediately.
			if (
				field === 'friendlyName' ||
				field === 'locationLabel' ||
				field === 'description'
			) {
				setSavedAreaValues((prev) => ({ ...prev, [field]: value }))
			}
			queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
			Burnt.toast({ title: 'Saved', preset: 'done' })
		} catch (err: any) {
			Burnt.toast({
				title: err?.message || 'Failed to save',
				preset: 'error',
			})
		} finally {
			setConfirmingField(null)
		}
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

				// Upload + persist immediately — image changes are saved on selection.
				if (dbArea?.id) {
					const uploadResult = await uploadAreaImageAsync({
						payload: {
							uri: imageUri,
							name: filename,
							type: mimeType,
						} as FileUploadPayload,
						areaId: dbArea.id,
					})
					const url =
						resolveImageUrl(uploadResult.fileUrl) || uploadResult.fileUrl
					await areaUpdateMutationFn({
						key: dbArea.key,
						imageUrl: url,
					} as Partial<AreaUpdatePayload>)
					queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
					setAreaFormState((prev) => ({ ...prev, imageUrl: url }))
				}
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

	// Handle remove area image press. Clears local draft state and persists the removal.
	const handleRemoveImage = async () => {
		setLocalAreaImage({ uri: '', name: '', type: '' })
		await areaUpdateMutationFn({
			key: dbArea?.key || '',
			imageUrl: '',
		} as Partial<AreaUpdatePayload>)
		queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
		setAreaFormState((prev) => ({ ...prev, imageUrl: '' }))
	}

	// API specific editable data
	const renderApiEditableData = useCallback(
		(apiOnly = false) => {
			if (!dbArea) return null

			// Helper to determine active display URI
			const displayUri = resolveImageUrl(localAreaImage.uri || dbArea.imageUrl)

			return (
				<View style={{ flex: 1 }}>
					{displayUri ? (
						<View>
							<RectangularMedia
								aspectRatio={16 / 9}
								isFullWidth
								ringColor={theme.colors.border}
								elevation={0}
								borderRadius={theme.radius.card}
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
								) : null}
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
											color={theme.colors.accent}
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
							<View
								style={{
									position: 'absolute',
									bottom: theme.space.sm,
									left: theme.space.sm,
								}}
							>
								<Button
									label="Remove"
									variant="destructive"
									icon="trash-can-outline"
									modifier={['small']}
									onPress={handleRemoveImage}
								/>
							</View>
							<View
								style={{
									position: 'absolute',
									bottom: theme.space.sm,
									right: theme.space.sm,
								}}
							>
								<Button
									label="Change"
									variant="primary"
									icon="image-edit-outline"
									modifier={['small']}
									onPress={handleChooseImage}
								/>
							</View>
						</View>
					) : (
						<Button
							label="Add area image"
							variant="primary"
							icon="image-plus"
							modifier={['full', 'tall']}
							onPress={handleChooseImage}
						/>
					)}

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
						initialValues={savedAreaValues}
						onFieldConfirm={handleFieldConfirm}
						confirmingField={confirmingField}
					/>
					{apiOnly ? (
						<View
							style={{
								flexDirection: 'row',
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
								Ensure your Hydrolink is powered on and connected to the
								network. Pull to refresh.
							</Text>
						</View>
					) : null}
				</View>
			)
		},
		[
			dbArea,
			areaFormState,
			savedAreaValues,
			confirmingField,
			theme.colors,
			theme.font,
			theme.space,
		],
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
			const mergedStation = { ...station, ...localStateMatch }

			return (
				<ScaleDecorator>
					{/* 
            Baking the spacing directly into the item container. This ensures
						the spacer scales and animates atomically with the card, removing
						layout recalculation pops.
          */}
					<View style={{ marginBottom: theme.space.lg }}>
						<Card>
							<EditableStationCardItem
								station={mergedStation}
								initialName={station.name ?? undefined}
								isActive={isActive}
								isLoading={isStationLoading}
								manualOverride={manualOverride}
								onDrag={drag}
								onDataChange={handleStationDataChange}
								onFieldCommit={(field, value) => {
									const committed = setNewValueForStation(
										station.id,
										field,
										value,
									)
									if (committed) {
										Burnt.toast({
											title:
												field === 'type' ? 'Role updated' : 'Station updated',
											preset: 'done',
										})
									}
								}}
								isMqttEditable={isAreaOnline}
								newLeadingIcon={
									localStateMatch
										? STATION_TYPE_ICON[localStateMatch.type]
										: undefined
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
			setNewValueForStation,
			theme.space.lg,
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
				refreshControl={
					<RefreshControl
						refreshing={currentScreenState.matches('loading')}
						onRefresh={() => send({ type: 'RETRY' })}
						progressViewOffset={theme.space.xl}
						colors={[theme.colors.accent]}
					/>
				}
			>
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
					<ScrollView
						refreshControl={
							<RefreshControl
								refreshing={currentScreenState.matches('loading')}
								onRefresh={() => send({ type: 'RETRY' })}
								progressViewOffset={theme.space.xl}
								colors={[theme.colors.accent]}
							/>
						}
					>
						{renderApiEditableData(true)}
					</ScrollView>
				</>
			)
		}

		// Fallback for NETWORK_ERROR, DEVICE_FETCH_FAILED, UNKNOWN_ERROR, etc.
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

	// Ready
	if (currentScreenState.matches('ready')) {
		if (!dbArea?.key) {
			console.log('Area not found for key:', key)
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

		if (!isAreaOnline) {
			return (
				<>
					<ScrollView
						refreshControl={
							<RefreshControl
								refreshing={currentScreenState.matches('loading')}
								onRefresh={() => send({ type: 'RETRY' })}
								progressViewOffset={theme.space.xl}
								colors={[theme.colors.accent]}
							/>
						}
					>
						{renderApiEditableData(true)}
					</ScrollView>
				</>
			)
		}

		// Normal area UI
		return (
			<>
				<View
					style={{
						gap: theme.space.sm,
						marginVertical: theme.space.sm,
						marginHorizontal: theme.space.md,
						flex: 1,
					}}
				>
					<DraggableFlatList
						data={allStations}
						keyExtractor={(item) => item.id.toString()}
						renderItem={renderStation}
						contentInsetAdjustmentBehavior="automatic"
						ListHeaderComponent={
							<>
								{renderApiEditableData()}
								<View style={{ marginVertical: theme.space.x2l }} />
								<SectionTitle text="Edit stations" />
							</>
						}
						ListFooterComponent={
							<View
								style={{
									gap: theme.space.x2l,
									paddingBottom: insets.bottom + theme.space.x3l,
								}}
							>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.md,
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
								colors={[theme.colors.accent]}
							/>
						}
						onDragEnd={({ data }) =>
							handleStationReorder(data.map((s) => s.id))
						}
						removeClippedSubviews={false}
						windowSize={5}
					/>
				</View>
			</>
		)
	}
}
