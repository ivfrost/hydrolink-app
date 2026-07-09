import { AppError } from '@/types/api'
import { User, userSchema } from '@/types/user'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const profileQueryFn = async (): Promise<User> => {
	const data = await apiFetch<User>('/me')

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return userSchema.parse(data.details)
}
