import { AppError } from '@/types/api'
import type { Area } from '@/types/area'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const areaLinkMutationFn = async (secret: string): Promise<Area> => {
	const data = await apiFetch<Area>('/me/devices/link', {
		method: 'POST',
		body: JSON.stringify({ secret }),
	})

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	return data.details
}

export const areaUnlinkMutationFn = async (areaId: number): Promise<void> => {
	const data = await apiFetch<void>('/me/devices/unlink', {
		method: 'DELETE',
		body: JSON.stringify({ deviceId: areaId }),
	})

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}
}

export const areaUpdateMutationFn = async (
	updates: Partial<Area>,
): Promise<Area> => {
	const areaId = updates.id
	if (!areaId) {
		throw new AppError('VALIDATION_FAILED', 'Area ID is required for updates.')
	}
	const data = await apiFetch<Area>(`/me/devices/${areaId}`, {
		method: 'PATCH',
		body: JSON.stringify(updates),
	})

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		}
		throw new AppError('UNKNOWN_ERROR', data.message)
	}

	return data.details
}
