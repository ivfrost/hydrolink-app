import { API_BASE_URL } from '@/constants'
import { AppError } from '@/types/api'
import {
	RegisterPayload,
	RegisterResponse,
	SignInPayload,
	SignInResponse,
} from '@/types/auth'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const signinFn = async (
	input: SignInPayload,
): Promise<SignInResponse> => {
	try {
		const response = await fetch(`${API_BASE_URL}/users/auth`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-client-platform': 'react-native',
			},
			body: JSON.stringify(input),
		})

		const data = (await response.json()) as SignInResponse

		if (data.code !== null) {
			if (isKnownErrorCode(data.code)) {
				throw new AppError(data.code, data.message)
			} else {
				throw new AppError('UNKNOWN_ERROR', data.message)
			}
		}

		return data as SignInResponse
	} catch (e) {
		if (e instanceof TypeError) {
			throw new AppError('NETWORK_ERROR', 'Could not connect to server')
		}
		throw e
	}
}

export const registerFn = async (
	payload: RegisterPayload,
): Promise<RegisterResponse> => {
	try {
		const response = await fetch(`${API_BASE_URL}/users`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-client-platform': 'react-native',
			},
			body: JSON.stringify(payload),
		})
		console.log(`${API_BASE_URL}/users`, payload)

		const data = (await response.json()) as RegisterResponse

		if (data.code !== null) {
			if (isKnownErrorCode(data.code)) {
				throw new AppError(data.code, data.message)
			} else {
				throw new AppError('UNKNOWN_ERROR', data.message)
			}
		}

		return data as RegisterResponse
	} catch (e) {
		if (e instanceof TypeError) {
			throw new AppError('NETWORK_ERROR', 'Could not connect to server')
		}
		throw e
	}
}
