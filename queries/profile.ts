import type { UserResponse } from '@/types/auth'
import type { ApiResponse } from '@/types/api'
import apiFetch from '@/utils/apiFetch'

export const profileQuery = {
	queryKey: ['profile'],
	queryFn: async (): Promise<UserResponse> => {
		const response = await apiFetch('/me')

		let data: ApiResponse<UserResponse> | null = null
		try {
			data = await response.json()
		} catch {
			data = null
		}

		if (!response.ok) {
			throw new Error(data?.message || 'PROFILE_FETCH_FAILED')
		}

		if (!data?.details) {
			throw new Error('PROFILE_FETCH_FAILED')
		}

		return data.details
	},
}
