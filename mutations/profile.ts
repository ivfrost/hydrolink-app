import type { ProfileInfo } from '@/app/settings/profile'
import type { UserResponse } from '@/types/auth'
import { ApiResponse } from '@/types/api'
import apiFetch from '@/utils/apiFetch'
import { encode as b64encode } from 'base-64'

export const profileUpdateFn = {
	mutationFn: async (
		profileData: ProfileInfo & {
			profilePicture?: { uri: string; type: string; name: string }
		},
	): Promise<UserResponse> => {
		const formData = new FormData()
		// Encode JSON payload as base64 and attach as a file-like object so RN
		// sends it with the right MIME type.
		const jsonString = JSON.stringify(profileData)
		const base64 = b64encode(jsonString)

		formData.append('data', {
			uri: `data:application/json;base64,${base64}`,
			type: 'application/json',
			name: 'data.json',
		} as any)

		// The "profilePicture" key is optional and expects a MultipartFile
		if (profileData.profilePicture) {
			formData.append('profilePicture', {
				uri: profileData.profilePicture.uri,
				type: profileData.profilePicture.type,
				name: profileData.profilePicture.name,
			} as any)
		}

		const response = await apiFetch('/me', {
			method: 'PUT',
			body: formData,
		})

		let data: ApiResponse<UserResponse> | null = null
		try {
			data = await response.json()
		} catch {
			data = null
		}

		if (!response.ok) {
			throw new Error(data?.message || 'UPDATE_FAILED')
		}

		if (!data?.details) {
			throw new Error('UPDATE_FAILED')
		}

		return data.details
	},
}
