import { AppError } from '@/types/api'
import { AreaDbData } from '@/types/area'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const areasQueryFn = async (): Promise<AreaDbData[]> => {
	const data = await apiFetch<AreaDbData[]>('/me/devices')

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	const areas = data.details
	if (!areas) return []

	return Array.isArray(areas) ? areas : [areas]
}
