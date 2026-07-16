import z from 'zod'

export interface Area {
	id: number
	key: string
	name: string
	location: string
	description: string
	firmware: string
	technicalName: string
	ip: string
	imageUrl: string
	createdAt: string
	updatedAt: string
	linkedAt: string
	lastSeen: string
	userId: number
	displayOrder: number
}

export interface AreaUpdatePayload {
	id: number
	key: string
	name: string
	location: string
	description: string
	imageUrl?: string
}

export const stationSchema = z.object({
	id: z.number(),
	name: z.string(),
	type: z.enum(['Solenoid', 'Pump', 'Fertilizer', 'Sensor', 'Unknown']),
	status: z.object({
		state: z.enum(['Running', 'Idle', 'Unknown']),
		cause: z.enum(['Manual', 'Sensor', 'Schedule', 'Done', 'None']),
	}),
	manualOverride: z
		.object({
			active: z.boolean(),
			start: z.coerce.string().optional(),
			end: z.coerce.string().optional(),
		})
		.optional(),
	// Current schedule is at idx 1, past at 0 and future at 2
	schedules: z.array(
		z.object({
			start: z.coerce.string(),
			end: z.coerce.string(),
			active: z.boolean(),
			ok: z.boolean(),
		}),
	),
})

export type StationStatus = z.infer<typeof stationSchema.shape.status>
export type StationSchedule = z.infer<
	typeof stationSchema.shape.schedules
>[number]
export type StationType = z.infer<typeof stationSchema.shape.type>
export type Station = z.infer<typeof stationSchema>
export const stationArrSchema = z.array(stationSchema)

// MQTT area data structure
export interface AreaData {
	key: string
	// stations are keyed by station ID
	stations: Record<number, Station>
	lastUpdated: string
	online?: boolean
}
