import { AppError } from '@/types/api'
import apiFetch from '@/utils/apiFetch'
import { encode as b64encode } from 'base-64'
import { ProfileUpdatePayload, User } from '@/types/user'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const profileUpdateFn = async (
	payload: ProfileUpdatePayload,
): Promise<User> => {
	const formData = new FormData()

	// Encode JSON payload as base64 and attach as a file-like object so RN
	// sends it with the right MIME type.
	const jsonString = JSON.stringify(payload)
	const base64 = b64encode(jsonString)

	formData.append('data', {
		uri: `data:application/json;base64,${base64}`,
		type: 'application/json',
		name: 'data.json',
	} as any)

	if (payload.profilePictureFile) {
		formData.append('profilePicture', {
			uri: payload.profilePictureFile.uri,
			type: payload.profilePictureFile.type,
			name: payload.profilePictureFile.name,
		} as any)
	}
	const data = await apiFetch<User>('/me', {
		method: 'PUT',
		body: formData,
	})

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return data.details as User
}
