import { z } from 'zod'

export const fileUploadSchema = z.object({
	uri: z.url(),
	name: z.string(),
	type: z.string(),
})

export type FileUploadPayload = z.infer<typeof fileUploadSchema> & {
	forceInstall?: boolean
}
export type UploadProfileImageVariables = {
	payload: FileUploadPayload
	userId: string
}
export type UploadAreaImageVariables = {
	payload: FileUploadPayload
	areaId: number
}