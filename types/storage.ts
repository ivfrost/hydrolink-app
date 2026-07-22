import { z } from 'zod'

export const fileUploadSchema = z.object({
	uri: z.url(),
	name: z.string(),
	type: z.string(),
})

export type FileUploadPayload = z.infer<typeof fileUploadSchema>
export type UploadAreaImageVariables = {
	payload: FileUploadPayload
	areaId: number
}
