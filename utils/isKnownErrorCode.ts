import { ErrorCode, errorCodes } from '@/constants'

export function isKnownErrorCode(code: unknown): code is ErrorCode {
	return (
		typeof code === 'string' &&
		Object.values(errorCodes).includes(code as ErrorCode)
	)
}
