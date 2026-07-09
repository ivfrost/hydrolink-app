import { TokenType } from '@/constants'
import { ApiResponse } from './api'
import { User, userSchema } from './user'
import { z } from 'zod'

// Register schemas and types
export const registerSchema = userSchema
	.omit({
		id: true,
		profilePictureUrl: true,
		settings: true,
		address: true,
		phoneNumber: true,
		roles: true,
	})
	.extend({
		password: z
			.string()
			.min(8, { message: 'Password must be at least 8 characters long' })
			.max(42, { message: 'Password must be at most 42 characters long' })
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\];'/\\]).+$/,
				{
					message:
						'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
				},
			),
	})
export type RegisterPayload = z.infer<typeof registerSchema>

// Sign-in schemas and types
export const signInSchema = registerSchema
	.pick({
		email: true,
	})
	.extend({
		// Password validation not needed for sign-in
		password: z.string(),
	})

export type SignInPayload = z.infer<typeof signInSchema>

// Auth response types
export interface TokenResponse {
	type: TokenType
	value: string
	expiryDate: string
	userId: number
}

export interface AuthResponse {
	userResponse: User
	tokens: TokenResponse[]
}
export type SignInResponse = ApiResponse<AuthResponse>
export type RegisterResponse = ApiResponse<AuthResponse>
export type RefreshResponse = ApiResponse<TokenResponse[]>
