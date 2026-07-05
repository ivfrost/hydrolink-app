import { ApiResponse } from './api'
import { UserRole, userSchema } from './user'
import { z } from 'zod'

export const registerSchema = userSchema
	.omit({
		id: true,
		profilePictureUrl: true,
		settings: true,
		address: true,
		phoneNumber: true,
	})
	.extend({
		password: z
			.string()
			.min(8)
			.max(42)
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\];'/\\]).+$/,
				{
					message:
						'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
				},
			),
	})

export type RegisterInput = z.infer<typeof registerSchema>

export interface LoginPayload {
	email: string
	password: string
}

export interface RegisterPayload {
	email: string
	username: string
	fullName: string
	password: string
}

export interface TokenResponse {
	type: 'AUTH_ACCESS_TOKEN' | 'AUTH_REFRESH_TOKEN' | 'AUTH_RECOVERY_CODE'
	value: string
	expiryDate: string
	userId: number
}

export interface UserResponse {
	id: number
	username: string
	fullName: string
	email: string
	profilePictureUrl: string | null
	phoneNumber: string
	address: string
	createdAt: string
	updatedAt: string
	roles: UserRole[]
	settings: Record<string, any>
}

export interface AuthResponse {
	user: UserResponse
	tokens: TokenResponse[]
}

export type LoginResponse = ApiResponse<AuthResponse>
export type RegisterResponse = ApiResponse<AuthResponse>
export type RefreshResponse = ApiResponse<TokenResponse[]>
