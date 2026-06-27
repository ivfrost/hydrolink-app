import { ApiResponse, TokenResponse } from './api'

export interface LoginPayload {
	email: string
	password: string
}

export type LoginResponse = ApiResponse<TokenResponse[]>
export type RegisterResponse = ApiResponse<TokenResponse[]>
