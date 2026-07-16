import { create } from 'zustand'

import { AreaData, stationArrSchema, StationType } from '@/types/area'

interface AreaState {
	// keyed by area key
	areas: Record<string, AreaData>
	updateStations: (areaKey: string, stations: AreaData['stations']) => void
	clearAreas: () => void
	setTypeForAreaStation: (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => void
	isOnline: (areaKey: string) => boolean
	getManualOverrideForStation: (
		areaKey: string,
		stationId: number,
	) => { active: boolean; start?: string; end?: string } | null
	handleIcomingMqtt: (topic: string, rawMessage: string) => void
}

export const useAreaStore = create<AreaState>((set) => ({
	areas: {},
	updateStations: (areaKey, stations) => {
		set((state) => {
			const area = state.areas[areaKey]
			if (!area) return state

			const updatedArea: AreaData = {
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
	clearAreas: () => set({ areas: {} }),
	setTypeForAreaStation: (areaKey, stationId, type) => {
		console.log(
			`[areaStore] Setting station type for area ${areaKey}, station ${stationId} to ${type}`,
		)
		set((state) => {
			const area = state.areas[areaKey]
			if (!area) return state

			const station = area.stations[stationId]
			if (!station) return state

			const updatedArea: AreaData = {
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
		const area: AreaData = useAreaStore.getState().areas[areaKey]
		return area?.online ?? false
	},
	getManualOverrideForStation: (areaKey, stationId) => {
		const area: AreaData = useAreaStore.getState().areas[areaKey]
		const station = area?.stations[stationId]
		if (!station || !station.manualOverride) return null

		return station.manualOverride
	},
	handleIcomingMqtt: (topic, rawMessage) => {
		const parts = topic.split('/')
		if (parts.length < 3) return

		const [_, areaKey, subTopic] = parts

		try {
			if (subTopic !== 'status') return

			const trimmed = rawMessage.trim()
			console.log(`[areaStore] MQTT message for area ${areaKey}: ${trimmed}`)

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
					console.error('[areaStore] Invalid station data:', validated.error)
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
}))
