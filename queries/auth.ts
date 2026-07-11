import { API_BASE_URL } from '@/constants'
import { ApiResponse, AppError } from '@/types/api'
import { MqttCredentialResponse, MqttCredentials } from '@/types/auth'
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

	if (!response.ok) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return data.details as boolean
}

// Backend returns ApiResponse with { userId, mqttToken } in details
export const getMqttCredentials = async (): Promise<MqttCredentials> => {
	try {
		// apiFetch sends access token in Authorization header to backend
		// and returns parsed JSON response
		const data = (await apiFetch('/users/auth/mqtt')) as MqttCredentialResponse

		if (data.code != null) {
			if (isKnownErrorCode(data.code)) {
				throw new AppError(data.code, data.message)
			} else {
				throw new AppError('UNKNOWN_ERROR', data.message)
			}
		}

		return data.details
	} catch (e) {
		if (e instanceof TypeError) {
			throw new AppError('NETWORK_ERROR', 'Could not connect to server')
		}
		throw e
	}
}
