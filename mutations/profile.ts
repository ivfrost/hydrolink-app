import type { ProfileInfo } from '@/app/settings/profile'
import { ApiResponse } from '@/types/api'
import apiFetch from '@/utils/apiFetch'

export const profileUpdateFn = {
	mutationFn: async (profileData: ProfileInfo): Promise<ApiResponse<void>> => {
		const response = await apiFetch('/me', {
			method: 'PUT',
			body: JSON.stringify(profileData),
		})
		if (!response.ok) {
			try {
				const errorData = await response.json()
				throw new Error(errorData.message || 'UPDATE_FAILED')
			} catch (parseError) {
				throw new Error('UPDATE_FAILED')
			}
		}
		return response.json()
	},
}
