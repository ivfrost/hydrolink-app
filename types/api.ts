import { ErrorCode } from '@/constants'

export interface TokenResponse {
	type: 'AUTH_ACCESS_TOKEN' | 'AUTH_REFRESH_TOKEN'
	value: string
	expiryDate: string
	userId: number
}

export interface ApiSuccessResponse<T> {
	timestamp: string
	status: number
	error: null
	code: null
	message: string
	details: T
}

export interface ApiErrorResponse {
	timestamp: string
	status: number
	error: string
	code: ErrorCode
	message: string
	details: unknown | null
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export class AppError extends Error {
	constructor(
		public readonly code: ErrorCode,
		message?: string,
	) {
		super(message)
		this.name = 'AppError'
	}
}
