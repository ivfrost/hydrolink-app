import { z } from 'zod'

export const userRolesSchema = z.enum(['ADMIN', 'USER'])
export const userSchema = z.object({
	id: z.number(),
	email: z
		.email({ message: 'Invalid email address' })
		.min(5, { message: 'Invalid email address' })
		.max(60, { message: 'Invalid email address' }),
	username: z
		.string()
		.min(5, { message: 'Username must be at least 5 characters long' })
		.max(20, { message: 'Username must be at most 20 characters long' }),
	fullName: z
		.string()
		.min(6, { message: 'Full name must be at least 6 characters long' })
		.max(40, { message: 'Full name must be at most 40 characters long' }),
	profilePictureUrl: z
		.url()
		.max(255, {
			message: 'Profile picture URL must be at most 255 characters long',
		})
		.nullable(),
	phoneNumber: z
		.string()
		.nullable()
		.default(null)
		.transform((val) => val ?? ''),
	address: z
		.string()
		.nullable()
		.default(null)
		.transform((val) => val ?? ''),
	createdAt: z.string(),
	updatedAt: z.string(),
	roles: userRolesSchema.array(),
	settings: z
		.record(z.string(), z.any())
		.nullable()
		.default(null)
		.transform((val) => val ?? {}),
})

export type UserRole = z.infer<typeof userRolesSchema>
export type User = z.infer<typeof userSchema>

export const profileUpdateSchema = userSchema
	.omit({
		id: true,
		roles: true,
		createdAt: true,
		updatedAt: true,
		profilePictureUrl: true,
		settings: true,
	})
	.extend({
		password: z
			.string()
			.min(8, { message: 'Password must be at least 8 characters long' })
			.max(42, { message: 'Password must be at most 42 characters long' })
			.optional(),
		currentPassword: z
			.string()
			.min(8, {
				message: 'Current password must be at least 8 characters long',
			})
			.max(42, {
				message: 'Current password must be at most 42 characters long',
			})
			.optional(),
		profilePictureFile: z
			.object({
				uri: z.string(),
				type: z.string(),
				name: z.string(),
			})
			.optional(),
	})
	.partial()

export type ProfileUpdatePayload = z.infer<typeof profileUpdateSchema>
