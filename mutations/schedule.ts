import { AppError } from '@/types/api'
import { Schedule, TimeWindowRequest } from '@/types/schedule'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const scheduleUpsertMutationFn = async (
	areaKey: string,
	date: string,
	windows: TimeWindowRequest[],
): Promise<Schedule> => {
	const data = await apiFetch<Schedule>(
		`/devices/${areaKey}/schedules/${date}`,
		{
			method: 'PUT',
			// The backend wraps the windows in a ScheduleRequest object.
			body: JSON.stringify({ windows }),
		},
	)

	if (data.code != null) {
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
	date: string,
): Promise<void> => {
	const data = await apiFetch<void>(`/devices/${areaKey}/schedules/${date}`, {
		method: 'DELETE',
	})

	if (data.code != null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}
}
