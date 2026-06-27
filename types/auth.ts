export interface LoginPayload {
	email: string
	password: string
}

export interface TokenResponse {
	type: 'AUTH_ACCESS_TOKEN' | 'AUTH_REFRESH_TOKEN'
	value: string
	expiryDate: string
}

export interface ApiResponse<T> {
	timestamp: string
	status: number
	error: string | null
	message: string
	details: T
}

export type LoginResponse = ApiResponse<TokenResponse[]>
export type RegisterResponse = ApiResponse<TokenResponse[]>
