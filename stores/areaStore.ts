import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import {
	AreaMqttData,
	ManualOverride,
	stationArrSchema,
	StationType,
} from '@/types/area'
import { normalizeMqttPayload } from '@/utils/mqttPayload'

import { useLogStore } from './logStore'

// How long the OTA "updating" flag may stay set before it is force-cleared.
// The ESP normally clears it by coming back online after flashing; this
// timeout covers the case where the update fails and the device never
// reconnects (e.g. a boot crash).
const OTA_UPDATE_TIMEOUT_MS = 5 * 60 * 1000

// Per-area timers that auto-clear the OTA updating flag.
const updatingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearUpdatingTimer(areaKey: string) {
	const timer = updatingTimers.get(areaKey)
	if (timer) {
		clearTimeout(timer)
		updatingTimers.delete(areaKey)
	}
}

function scheduleUpdatingTimeout(areaKey: string) {
	clearUpdatingTimer(areaKey)
	updatingTimers.set(
		areaKey,
		setTimeout(() => {
			updatingTimers.delete(areaKey)
			useAreaStore.setState((state) => {
				const area = state.areas[areaKey]
				if (!area?.updating) return state
				return {
					areas: {
						...state.areas,
						[areaKey]: { ...area, updating: false },
					},
				}
			})
		}, OTA_UPDATE_TIMEOUT_MS),
	)
}

interface AreaState {
	areas: Record<string, AreaMqttData>
	clearAreas: () => void
	removeArea: (areaKey: string) => void
	updateStations: (areaKey: string, stations: AreaMqttData['stations']) => void
	setTypeForAreaStation: (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => void
	isOnline: (areaKey: string) => boolean
	isUpdating: (areaKey: string) => boolean
	stationDisplayOrder: Record<string, number[]>
	setStationDisplayOrder: (areaKey: string, order: number[]) => void
	getManualOverrideForStation: (
		areaKey: string,
		stationId: number,
	) => ManualOverride | null
	handleIncomingMqtt: (topic: string, rawMessage: string) => void
}

type PersistedAreaState = Pick<AreaState, 'stationDisplayOrder'>

export const useAreaStore = create<AreaState>()(
	persist(
		(set, get) => ({
			areas: {},
			stationDisplayOrder: {},
			clearAreas: () => set({ areas: {} }),
			removeArea: (areaKey) => {
				set((state) => {
					const newAreas = { ...state.areas }
					delete newAreas[areaKey]
					return { areas: newAreas }
				})
			},
			updateStations: (areaKey, stations) => {
				set((state) => {
					const area = state.areas[areaKey]
					if (!area) return state

					const updatedArea: AreaMqttData = {
						key: area.key,
						stations: stations,
						lastUpdated: new Date().toISOString(),
						online: area.online,
					}

					return {
						areas: {
							...state.areas,
							[areaKey]: updatedArea,
						},
					}
				})
			},
			setTypeForAreaStation: (areaKey, stationId, type) => {
				console.log(
					`[areaStore] Setting station type for area ${areaKey}, station ${stationId} to ${type}`,
				)
				set((state) => {
					const area = state.areas[areaKey]
					if (!area) return state

					const station = area.stations[stationId]
					if (!station) return state

					const updatedArea: AreaMqttData = {
						key: area.key,
						stations: {
							...area.stations,
							[stationId]: {
								...station,
								type,
							},
						},
						lastUpdated: area.lastUpdated,
						online: area.online,
					}

					return {
						areas: {
							...state.areas,
							[areaKey]: updatedArea,
						},
					}
				})
			},
			isOnline: (areaKey) => {
				const area: AreaMqttData = get().areas[areaKey]
				return area?.online ?? false
			},
			isUpdating: (areaKey: string) => {
				const area: AreaMqttData = get().areas[areaKey]
				return area?.updating ?? false
			},
			setStationDisplayOrder: (areaKey, order) => {
				// Check if the order is different from the current one to avoid unnecessary state updates
				const currentOrder = get().stationDisplayOrder[areaKey] || []
				if (
					currentOrder.length === order.length &&
					currentOrder.every((id, idx) => id === order[idx])
				) {
					return
				}
				set((state) => ({
					stationDisplayOrder: {
						...state.stationDisplayOrder,
						[areaKey]: order,
					},
				}))
			},
			getManualOverrideForStation: (areaKey, stationId) => {
				const area: AreaMqttData = get().areas[areaKey]
				const station = area?.stations[stationId]
				if (!station || !station.status.manualOverride) return null

				return station.status.manualOverride
			},
			handleIncomingMqtt: (topic, rawMessage) => {
				const parts = topic.split('/')
				if (parts.length < 3) return

				const [_, areaKey, subTopic] = parts

				try {
					const trimmed = normalizeMqttPayload(rawMessage)

					if (subTopic === 'logs') {
						useLogStore.getState().addLog(areaKey, trimmed)

						if (trimmed.includes('type=OTAUpdate')) {
							scheduleUpdatingTimeout(areaKey)
							set((state) => {
								const prev = state.areas[areaKey]
								if (!prev) return state
								return {
									areas: {
										...state.areas,
										[areaKey]: { ...prev, updating: true },
									},
								}
							})
						}
						return
					}

					if (subTopic !== 'status') return
					set((state) => {
						const prev = state.areas[areaKey] ?? {
							key: areaKey,
							stations: {},
							online: false,
							lastUpdated: null,
						}

						// Case 1: online/offline ping
						if (trimmed === 'online' || trimmed === 'offline') {
							return {
								areas: {
									...state.areas,
									[areaKey]: {
										...prev,
										online: trimmed === 'online',
										lastUpdated: new Date().toISOString(),
										// Clear update flag when device comes back online
										updating: trimmed === 'online' ? false : prev.updating,
									},
								},
							}
						}

						// Case 2: JSON status
						const data = JSON.parse(trimmed)
						const targetArray =
							data && typeof data === 'object' ? data.stations : null

						const validated = stationArrSchema.safeParse(targetArray)
						if (!validated.success) {
							console.error(
								'[areaStore] Invalid station data:',
								validated.error,
							)
							return state
						}

						const normalizedStations = Object.fromEntries(
							validated.data.map((s) => [s.id, s]),
						)
						const mergedStations = {
							...prev.stations,
							...normalizedStations,
						}

						return {
							areas: {
								...state.areas,
								[areaKey]: {
									...prev,
									online: true,
									updating: false,
									stations: mergedStations,
									lastUpdated: new Date().toISOString(),
								},
							},
						}
					})
				} catch (error) {
					console.error('[areaStore] Error processing MQTT message:', error)
				}
			},
		}),
		// We persist only the stationDisplayOrder to avoid storing stale MQTT data.
		// We liberate the API and the esp from having to keep track of the station
		// order.
		{
			name: 'area-store',
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state): PersistedAreaState => ({
				stationDisplayOrder: state.stationDisplayOrder,
			}),
		},
	),
)
