import { useAuth } from '@/stores/authStore'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { RefreshResponse } from '@/types/auth'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const logoutAndRedirect = async () => {
	useAuth.getState().removeAccessToken()
	await SecureStore.deleteItemAsync('refreshToken')
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

		if (!refreshResponse.ok) {
			console.error('[apiFetch] Refresh failed, logging out.')
			await logoutAndRedirect()
			throw new Error('SESSION_EXPIRED')
		}

		const data: RefreshResponse = await refreshResponse.json()
		const tokens = data.details ?? []
		const newAccessToken = tokens.find((t) => t.type === 'AUTH_ACCESS_TOKEN')
		const newRefreshToken = tokens.find((t) => t.type === 'AUTH_REFRESH_TOKEN')

		if (!newAccessToken || !newRefreshToken) {
			console.error('[apiFetch] Invalid refresh response, logging out.')
			await logoutAndRedirect()
			throw new Error('SESSION_EXPIRED')
		}

		useAuth.getState().setAccessToken(newAccessToken.value)
		await SecureStore.setItemAsync('refreshToken', newRefreshToken.value)
		console.log('[apiFetch] New tokens set.')

		return newAccessToken.value
	})()

	try {
		return await refreshPromise
	} finally {
		refreshPromise = null
	}
}

const apiFetch = async (url: string, options: RequestInit = {}) => {
	const accessToken = useAuth.getState().accessToken
	const isFormData = options.body instanceof FormData

	// Normalize headers into a plain object
	const normalizedHeaders: Record<string, string> = {}
	if (options.headers) {
		if (options.headers instanceof Headers) {
			options.headers.forEach((value, key) => {
				normalizedHeaders[key] = value
			})
		} else {
			Object.assign(
				normalizedHeaders,
				options.headers as Record<string, string>,
			)
		}
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		...normalizedHeaders,
	}

	if (!isFormData) {
		headers['Content-Type'] = 'application/json'
	}

	let response = await fetch(`${API_BASE_URL}${url}`, {
		...options,
		headers,
	})

	if (response.status === 401) {
		console.warn('[apiFetch] 401 Unauthorized, attempting refresh…')

		const newAccessToken = await refreshAccessToken()

		// retry original request with new token
		const retryHeaders: Record<string, string> = {
			Authorization: `Bearer ${newAccessToken}`,
			...normalizedHeaders,
		}
		if (!isFormData) {
			retryHeaders['Content-Type'] = 'application/json'
		}

		response = await fetch(`${API_BASE_URL}${url}`, {
			...options,
			headers: retryHeaders,
		})
	}

	return response
}

export default apiFetch
