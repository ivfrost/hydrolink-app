import { router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import { API_BASE_URL, ErrorCode } from '@/constants'
import { useAuth } from '@/stores/authStore'
import { ApiResponse, AppError } from '@/types/api'
import { RefreshResponse } from '@/types/auth'

import { isKnownErrorCode } from './isKnownErrorCode'

const logoutAndRedirect = async () => {
	useAuth.getState().removeAccessToken()
	await SecureStore.deleteItemAsync('refreshToken')
	// Small delay to ensure state clears before routing
	await new Promise((r) => setTimeout(r, 10))
	router.replace('/onboarding/onboarding2')
}

// Shared in-flight refresh promise so concurrent 401s dedupe into a single
// refresh call instead of racing each other and stomping on rotated tokens.
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async (): Promise<string> => {
	if (refreshPromise) return refreshPromise

	refreshPromise = (async () => {
		const refreshToken = await SecureStore.getItemAsync('refreshToken')
		if (!refreshToken) {
			console.log('[apiFetch] called by:', new Error().stack)
			console.error('[apiFetch] No refresh token found, logging out.')
			await logoutAndRedirect()
			throw new Error('SESSION_EXPIRED')
		}

		console.log('[apiFetch] Refreshing access token…')
		const refreshResponse = await fetch(`${API_BASE_URL}/users/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-client-platform': 'react-native',
			},
			body: JSON.stringify({ refreshToken }),
		})
		console.log('[apiFetch] Refresh response status:', refreshResponse)

		if (refreshResponse.status === 401) {
			console.error(
				'[apiFetch] Refresh token is invalid/expired (401), hard logout.',
			)
			await logoutAndRedirect()
			throw new AppError(
				'TOKEN_EXPIRED',
				'Your session has expired. Please log in again.',
			)
		}

		const data = (await refreshResponse.json()) as RefreshResponse

		// If backend returns a non-null error code, the refresh session is invalid
		if (data.code != null) {
			const isKnown = isKnownErrorCode(data.code)

			console.error(
				`[apiFetch] Refresh failed with ${isKnown ? 'known' : 'unknown'} error code ${data.code}, logging out.`,
			)

			await logoutAndRedirect()
			throw new AppError(isKnown ? data.code : 'UNKNOWN_ERROR', data.message)
		}

		const tokens = data.details
		if (!tokens || !Array.isArray(tokens)) {
			console.error('[apiFetch] Invalid refresh response, logging out.')
			await logoutAndRedirect()
			throw new AppError('UNKNOWN_ERROR', 'Invalid refresh response')
		}
		const newAccessToken = tokens.find((t) => t.type === 'AUTH_ACCESS_TOKEN')
		const newRefreshToken = tokens.find((t) => t.type === 'AUTH_REFRESH_TOKEN')

		if (!newAccessToken || !newRefreshToken) {
			console.error('[apiFetch] Invalid refresh response, logging out.')
			await logoutAndRedirect()
			throw new AppError('UNKNOWN_ERROR', 'Invalid refresh response')
		}

		useAuth.getState().setAccessToken(newAccessToken.value)
		await SecureStore.setItemAsync('refreshToken', newRefreshToken.value)
		console.log('[apiFetch] New tokens set.')
		return newAccessToken.value
	})()

	try {
		return await refreshPromise
	} finally {
		// Always clear the promise after completion so subsequent failures can re-trigger refresh
		refreshPromise = null
	}
}

const apiFetch = async <T = unknown>(
	url: string,
	options: RequestInit = {},
): Promise<ApiResponse<T>> => {
	const accessToken = useAuth.getState().accessToken
	const isFormData = options.body instanceof FormData

	const headers = new Headers(options.headers)
	if (!headers.has('Authorization') && accessToken) {
		headers.set('Authorization', `Bearer ${accessToken}`)
	}
	if (isFormData) {
		// Force remove Content-Type so the browser calculates the multipart
		// boundary
		headers.delete('Content-Type')
	} else if (!headers.has('Content-Type')) {
		// Set default for JSON/typical payloads if not provided
		headers.set('Content-Type', 'application/json')
	}

	const finalOptions: RequestInit = {
		...options,
		headers,
	}

	// Expects API_BASE_URL to not have a trailing slash, and url to have a
	// leading slash
	let response = await fetch(`${API_BASE_URL}${url}`, finalOptions)
	// Read raw text first to check for empty bodies safely
	const responseText = await response.text()
	let data = (responseText ? JSON.parse(responseText) : {}) as ApiResponse<T>

	const authErrors: ErrorCode[] = ['TOKEN_EXPIRED', 'TOKEN_INVALID']

	// Don't retry if the error is due to bad credentials as opposed to an
	// expired or invalid token.
	const isBadCredentials = data.code === 'BAD_CREDENTIALS'

	// If the response is an auth error, attempt to refresh the token and retry
	// the original request with a new access token.
	const isAuthError =
		!isBadCredentials &&
		(response.status === 401 ||
			(data.code != null &&
				authErrors.includes(data.code as unknown as ErrorCode)))

	if (isAuthError) {
		console.warn(`[apiFetch] ${data.code} received, attempting refresh…`)
		const newAccessToken = await refreshAccessToken()

		const retryHeaders = new Headers(finalOptions.headers)
		retryHeaders.set('Authorization', `Bearer ${newAccessToken}`)

		const retryOptions: RequestInit = {
			...finalOptions,
			headers: retryHeaders,
		}

		response = await fetch(`${API_BASE_URL}${url}`, retryOptions)
		data = (await response.json()) as ApiResponse<T>

		// If the retry fails with another auth error, log out the user
		const isRetryAuthError =
			response.status === 401 ||
			(data.code != null &&
				authErrors.includes(data.code as unknown as ErrorCode))
		if (isRetryAuthError) {
			console.error(
				`[apiFetch] ${data.code} received on retry, logging out user.`,
			)
			await logoutAndRedirect()
			throw new AppError(
				'TOKEN_EXPIRED',
				'Your session has expired. Please log in again.',
			)
		}

		// If it wasn't an auth error but still a failure status, throw it up to
		// the caller
		if (!response.ok) {
			throw new AppError(
				'UNKNOWN_ERROR',
				data.message || 'An error occurred during the request.',
			)
		}
	}

	return data
}

export default apiFetch
