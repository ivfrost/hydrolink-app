import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { router } from 'expo-router'
import { fetch } from 'expo/fetch'

import { API_BASE_URL } from '@/constants'
import { ApiResponse, AppError } from '@/types/api'

import { isKnownErrorCode } from './isKnownErrorCode'

// Dedupe concurrent sign-outs. Several mounted queries can 401 at once after a
// session expires (areas, profile, schedules, MQTT credentials); without this
// guard each one runs logoutAndRedirect, re-navigating and re-triggering
// refetches that loop the whole 401 → sign-out → navigate sequence.
let logoutPromise: Promise<void> | null = null

const logoutAndRedirect = async () => {
	if (logoutPromise) return logoutPromise

	logoutPromise = (async () => {
		try {
			await signOut()
		} catch (e) {
			console.warn('[apiFetch] Amplify signOut failed:', e)
		}
		// Small delay to ensure state clears before routing
		await new Promise((r) => setTimeout(r, 10))
		router.replace('/onboarding/onboarding2')
	})().finally(() => {
		setTimeout(() => {
			logoutPromise = null
		}, 1000)
	})

	return logoutPromise
}

// Amplify keeps the ID token fresh and refreshes it automatically. Returns the
// current ID token (or null when there is no active session).
const getIdToken = async (forceRefresh = false): Promise<string | null> => {
	try {
		const { tokens } = await fetchAuthSession({ forceRefresh })
		return tokens?.idToken?.toString() ?? null
	} catch {
		return null
	}
}

const apiFetch = async <T = unknown>(
	url: string,
	options: RequestInit = {},
): Promise<ApiResponse<T>> => {
	const isFormData = options.body instanceof FormData

	const buildHeaders = (token: string | null) => {
		const headers = new Headers(options.headers)
		if (token && !headers.has('Authorization')) {
			headers.set('Authorization', `Bearer ${token}`)
		}
		if (isFormData) {
			// Force remove Content-Type so the browser calculates the multipart
			// boundary
			headers.delete('Content-Type')
		} else if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json')
		}
		return headers
	}

	const request = async (token: string | null) => {
		const finalOptions: RequestInit = {
			...options,
			headers: buildHeaders(token),
		}
		const response = await fetch(`${API_BASE_URL}${url}`, finalOptions)
		const responseText = await response.text()
		const parsed = responseText ? JSON.parse(responseText) : {}
		// The backend omits null fields (JsonInclude.NON_NULL), so a successful
		// response has no `code` key at all. Default it to null so the envelope
		// matches the declared ApiSuccessResponse contract for all callers.
		const data = { code: null, ...parsed } as ApiResponse<T>
		return { response, data }
	}

	let token = await getIdToken()
	const first = await request(token)
	let response = first.response
	let data = first.data

	// If the token was stale, force a fresh one and retry exactly once.
	if (response.status === 401) {
		token = await getIdToken(true)
		const retry = await request(token)
		response = retry.response
		data = retry.data
	}

	if (response.status === 401 && token) {
		await logoutAndRedirect()
		throw new AppError(
			'TOKEN_EXPIRED',
			'Your session has expired. Please log in again.',
		)
	}

	if (response.status === 401) {
		throw new AppError(
			'TOKEN_EXPIRED',
			'Authentication is not ready. Please try again.',
		)
	}

	if (!response.ok) {
		const code = isKnownErrorCode(data.code) ? data.code : 'UNKNOWN_ERROR'
		throw new AppError(
			code,
			data.message || 'An error occurred during the request.',
		)
	}

	return data
}

export default apiFetch
