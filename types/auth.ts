import { ApiResponse, TokenResponse } from './api'

export interface LoginPayload {
	email: string
	password: string
}

export interface RegisterPayload {
	email: string
	username: string
	fullName: string
	password: string
	preferredLanguage: string
}

export type LoginResponse = ApiResponse<TokenResponse[]>
export type RegisterResponse = ApiResponse<TokenResponse[]>
