import { useAuth } from '@/stores/authStore'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import { LoginResponse } from '@/types/auth'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const apiFetch = async (url: string, options: RequestInit = {}) => {
	const accessToken = useAuth.getState().accessToken

	const response = await fetch(`${API_BASE_URL}${url}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
			...options.headers,
		},
	})

	if (response.status === 401) {
		// attempt refresh
		const refreshToken = await SecureStore.getItemAsync('refreshToken')
		if (!refreshToken) {
			useAuth.getState().removeAccessToken()
			router.replace('/onboarding/onboarding3')
			throw new Error('SESSION_EXPIRED')
		}

		const refreshResponse = await fetch(
			`${API_BASE_URL}/v1/users/auth/refresh`,
			{
				method: 'POST',
				headers: { Authorization: `Bearer ${refreshToken}` },
			},
		)

		if (!refreshResponse.ok) {
			useAuth.getState().removeAccessToken()
			await SecureStore.deleteItemAsync('refreshToken')
			// send to login/register page if refresh fails
			router.replace('/onboarding/onboarding2')
			throw new Error('SESSION_EXPIRED')
		}

		const data: LoginResponse = await refreshResponse.json()
		const newAccessToken = data.details.find(
			(t) => t.type === 'AUTH_ACCESS_TOKEN',
		)!
		useAuth.getState().setAccessToken(newAccessToken.value)

		// retry original request with new token
		return fetch(`${API_BASE_URL}${url}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${newAccessToken.value}`,
				...options.headers,
			},
		})
	}

	return response
}

export default apiFetch
