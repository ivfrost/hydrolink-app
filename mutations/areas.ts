import { ApiResponse } from '@/types/api'
import type { AreaResponse } from '@/types/area'
import apiFetch from '@/utils/apiFetch'

export const areaLinkMutation = {
	mutationFn: async (secret: string): Promise<AreaResponse> => {
		const response = await apiFetch('/me/devices/link', {
			method: 'POST',
			body: JSON.stringify({ secret }),
		})

		let data: ApiResponse<AreaResponse> | null = null
		try {
			data = await response.json()
		} catch {
			data = null
		}

		if (!response.ok) {
			throw new Error(data?.message || 'LINK_FAILED')
		}

		if (!data?.details) {
			throw new Error('LINK_FAILED')
		}

		return data.details
	},
}

export const areaUnlinkMutation = {
	mutationFn: async (areaId: number): Promise<void> => {
		const response = await apiFetch('/me/devices/unlink', {
			method: 'DELETE',
			body: JSON.stringify({ deviceId: areaId }),
		})

		if (!response.ok) {
			let message = 'UNLINK_FAILED'
			try {
				const data = await response.json()
				message = data?.message || message
			} catch {
				// no body, use default message
			}
			throw new Error(message)
		}
	},
}
