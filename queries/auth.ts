import { API_BASE_URL } from '@/constants'
import { ApiResponse, AppError } from '@/types/api'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const checkAvailabilityFn = async (
	emailUsername: string,
): Promise<boolean> => {
	const isEmail = emailUsername.includes('@')
	const url = isEmail
		? `/users/validate?email=${encodeURIComponent(emailUsername)}`
		: `/users/validate?username=${encodeURIComponent(emailUsername)}`

	const response = await fetch(`${API_BASE_URL}${url}`)

	const data = (await response.json()) as ApiResponse<boolean>

	if (!response.ok) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return data.details as boolean
}
