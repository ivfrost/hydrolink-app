import { File } from 'expo-file-system'

import { AppError } from '@/types/api'
import type { FileUploadPayload } from '@/types/storage'
import apiFetch from '@/utils/apiFetch'
import { isKnownErrorCode } from '@/utils/isKnownErrorCode'

export const areaFileUploadFn = async (
	payload: FileUploadPayload,
	areaId: number,
): Promise<{ fileUrl: string }> => {
	const file = new File(payload.uri)

	const formData = new FormData()
	formData.append('file', file)

	const safeAreaId = encodeURIComponent(areaId)

	const data = await apiFetch<{ fileUrl: string }>(
		`/storage/areas/${safeAreaId}/upload`,
		{
			method: 'POST',
			body: formData,
		},
	)

	if (data.code !== null) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return data.details as { fileUrl: string }
}

export const areaStationFileUploadFn = async (
	payload: FileUploadPayload,
	areaId: string,
	stationId: string,
): Promise<{ fileUrl: string }> => {
	const file = new File(payload.uri)
	const formData = new FormData()

	formData.append('file', file)

	const data = await apiFetch<{ fileUrl: string }>(
		`/storage/areas/${encodeURIComponent(areaId)}/stations/${encodeURIComponent(stationId)}/upload`,
		{
			method: 'POST',
			body: formData,
		},
	)

	if (data.code) {
		if (isKnownErrorCode(data.code)) {
			throw new AppError(data.code, data.message)
		} else {
			throw new AppError('UNKNOWN_ERROR', data.message)
		}
	}

	return data.details as { fileUrl: string }
}
