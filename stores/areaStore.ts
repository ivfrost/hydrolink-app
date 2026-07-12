import { create } from 'zustand'

import { AreaData, stationArrSchema, StationType } from '@/types/area'

interface AreaState {
	// keyed by area key
	areas: Record<string, AreaData>
	clearAreas: () => void
	setStationTypeForArea: (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => void
	isOnline: (areaKey: string) => boolean
	handleIcomingMqtt: (topic: string, rawMessage: string) => void
}

export const useAreaStore = create<AreaState>((set) => ({
	areas: {},
	clearAreas: () => set({ areas: {} }),
	setStationTypeForArea: (areaKey, stationId, type) => {
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
	handleIcomingMqtt: (topic, rawMessage) => {
		const parts = topic.split('/')
		if (parts.length < 3) return

		const [_, areaKey, subTopic] = parts

		try {
			if (subTopic !== 'status') return

			const trimmed = rawMessage.trim()

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

				return {
					areas: {
						...state.areas,
						[areaKey]: {
							...prev,
							online: true,
							stations: normalizedStations,
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
