import { API_BASE_URL } from '@/constants'
import { ApiResponse, AppError } from '@/types/api'
import apiFetch from '@/utils/apiFetch'
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

	if (!response.ok || data.code != null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	return data.details as boolean
}

// Materializes the user's local row and binds the Cognito sub right after
// sign-in so subsequent API calls find it immediately instead of lazily.
export const verifySyncFn = async (): Promise<void> => {
	try {
		await apiFetch('/verify-sync', { method: 'POST' })
	} catch (e) {
		// Non-fatal: the API also binds the row lazily on first use.
		console.warn('[auth] verify-sync failed:', e)
	}
}
