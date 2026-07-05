import { ApiResponse } from '@/types/api'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export const checkAvailabilityQuery = (emailUsername: string) => ({
	queryKey: ['validEmailUsername', emailUsername],
	queryFn: async (): Promise<boolean> => {
		const isEmail = emailUsername.includes('@')
		const url = isEmail
			? `/users/validate?email=${encodeURIComponent(emailUsername)}`
			: `/users/validate?username=${encodeURIComponent(emailUsername)}`

		const response = await fetch(`${API_BASE_URL}${url}`)

		let data: ApiResponse<boolean> | null = null
		try {
			data = await response.json()
		} catch {
			data = null
		}

		if (!response.ok) {
			throw new Error(data?.message || 'VALIDATION_FAILED')
		}
		if (data?.details === undefined) {
			throw new Error('VALIDATION_FAILED')
		}

		return data.details
	},
})
