import apiFetch from '@/utils/apiFetch'
import { User } from '@/types/user'
import { ApiResponse } from '@/types/api'

export const profileQuery = {
	queryKey: ['profile'],
	queryFn: async (): Promise<ApiResponse<User>> => {
		const response = await apiFetch('/me')
		return response.json()
	},
}
