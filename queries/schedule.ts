import { AppError } from '@/types/api'
import { Schedule } from '@/types/schedule'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const areaScheduleQueryFn = async (
	areaKey: string,
): Promise<Schedule[]> => {
	const data = await apiFetch<Schedule>(`/devices/${areaKey}/schedules`)

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	const schedules = data.details
	if (!schedules) return []

	return Array.isArray(schedules) ? schedules : [schedules]
}

export const areaScheduleForDayQueryFn = async (
	areaKey: string,
	dayOfWeek: string,
): Promise<Schedule | null> => {
	const data = await apiFetch<Schedule>(
		`/devices/${areaKey}/schedules/${dayOfWeek}`,
	)

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	return data.details || null
}
