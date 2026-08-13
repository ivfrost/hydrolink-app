import { AppError } from '@/types/api'
import { Schedule, TimeWindowRequest } from '@/types/schedule'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const scheduleUpsertMutationFn = async (
	areaKey: string,
	dayOfWeek: string,
	windows: TimeWindowRequest[],
): Promise<Schedule> => {
	const data = await apiFetch<Schedule>(
		`/devices/${areaKey}/schedules/${dayOfWeek}`,
		{
			method: 'PUT',
			body: JSON.stringify(windows),
		},
	)

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	const scheduleResponse = data.details
	if (!scheduleResponse) {
		throw new AppError(
			'NO_SCHEDULE_RESPONSE',
			'No schedule response received from the server.',
		)
	}

	return scheduleResponse
}

export const scheduleDeleteMutationFn = async (
	areaKey: string,
	dayOfWeek: string,
): Promise<void> => {
	const data = await apiFetch<void>(
		`/devices/${areaKey}/schedules/${dayOfWeek}`,
		{
			method: 'DELETE',
		},
	)

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}
}
