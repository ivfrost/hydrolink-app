export interface TokenResponse {
	type: 'AUTH_ACCESS_TOKEN' | 'AUTH_REFRESH_TOKEN'
	value: string
	expiryDate: string
	userId: number
}

export interface ApiResponse<T> {
	timestamp: string
	status: number
	error: string | null
	message: string
	details: T
}
