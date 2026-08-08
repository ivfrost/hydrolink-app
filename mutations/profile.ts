import { AppError } from '@/types/api'
import { ProfileUpdatePayload, User } from '@/types/user'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const profileUpdateFn = async (
	payload: ProfileUpdatePayload,
): Promise<User> => {
	const rest = payload as any
	const data = await apiFetch<User>('/me', {
		method: 'PATCH',
		body: JSON.stringify(rest),
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
