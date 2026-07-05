import { AreaResponse } from '@/types/area'
import apiFetch from '@/utils/apiFetch'
export const areasQuery = {
	queryKey: ['areas'],
	queryFn: async (): Promise<AreaResponse[]> => {
		const response = await apiFetch('/me/devices')
		const json = await response.json()

		if (!response.ok) {
			throw new Error(json.message || 'AREAS_FETCH_FAILED')
		}

		const areas = json?.details
		if (!areas) return []

		return Array.isArray(areas) ? areas : [areas]
	},
}
