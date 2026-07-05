import { z } from 'zod'

export type UserRole = 'ADMIN' | 'USER'

export const userSchema = z.object({
	id: z.number(),
	email: z.email().min(5).max(60),
	username: z.string().min(5).max(20),
	fullName: z.string().min(6).max(40),
	profilePictureUrl: z.url().nullable(),
	phoneNumber: z.string().default(''),
	address: z.string().default(''),
	settings: z.record(z.string(), z.any()),
})

export type User = z.infer<typeof userSchema>
