import { z } from 'zod'

export const userSchema = z.object({
	id: z.number(),
	email: z.email(),
	username: z.string(),
	fullName: z.string(),
	profilePictureUrl: z.string().url(),
	phoneNumber: z.string(),
	address: z.string().optional(),
	preferredLanguage: z.string(),
	settings: z.record(z.string(), z.any()),
})

export type User = z.infer<typeof userSchema>
