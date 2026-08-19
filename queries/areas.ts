import { AppError } from '@/types/api'
import { AreaDbData } from '@/types/area'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const areasQueryFn = async (): Promise<AreaDbData[]> => {
	const data = await apiFetch<AreaDbData[]>('/me/devices')
	if (data.code != null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}
	return Array.isArray(data.details) ? data.details : []
}
