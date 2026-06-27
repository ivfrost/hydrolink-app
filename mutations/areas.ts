import { ApiResponse } from '@/types/api'
import apiFetch from '@/utils/apiFetch'

export const areaLinkMutation = {
	mutationFn: async (secret: string): Promise<ApiResponse<void>> => {
		const response = await apiFetch('/me/devices/link', {
			method: 'POST',
			body: JSON.stringify({ secret }),
		})
		if (!response.ok) throw new Error('LINK_FAILED')
		return response.json()
	},
}
