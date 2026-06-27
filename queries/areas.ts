import { ApiResponse } from '@/types/api'
import { Area } from '@/types/area'
import apiFetch from '@/utils/apiFetch'

export const areasQuery = {
	queryKey: ['areas'],
	queryFn: async (): Promise<ApiResponse<Area[]>> => {
		const response = await apiFetch('/me/devices')
		return response.json()
	},
}
