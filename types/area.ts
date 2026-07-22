import { z } from 'zod'

import { MqttAction, MqttCause } from './mqtt'

export const areaDbDataSchema = z.object({
	id: z.number(),
	key: z.string(),
	friendlyName: z.string(),
	locationLabel: z.string(),
	locationCoordinates: z.string(),
	description: z.string(),
	imageUrl: z.url().nullable().optional(),
	firmware: z.string(),
	technicalName: z.string(),
	ip: z.string(),
	createdAt: z.coerce.date().transform((date) => date.toISOString()),
	updatedAt: z.coerce.date().transform((date) => date.toISOString()),
	linkedAt: z.coerce.date().transform((date) => date.toISOString()),
	lastSeen: z.coerce.date().transform((date) => date.toISOString()),
	userId: z.number(),
	displayOrder: z.number(),
})

export type AreaDbData = z.infer<typeof areaDbDataSchema>

export const manualOverrideSchema = z.object({
	active: z.boolean(),
	start: z.number(),
	end: z.number(),
})

export type ManualOverride = z.infer<typeof manualOverrideSchema>

export const stationSchema = z.object({
	id: z.number(),
	type: z.enum(['Solenoid', 'Pump', 'Fertilizer', 'Sensor', 'Unknown']),
	name: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	// TODO: add API minio endpoint to upload images and store the URL here
	imageUrl: z.url().nullable().optional(),
	status: z.object({
		state: z.enum(['Running', 'Idle', 'Unknown']),
		cause: z.enum(['Manual', 'Sensor', 'Schedule', 'Done', 'None']),
		manualOverride: manualOverrideSchema.optional(),
	}),

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
export interface AreaMqttData {
	key: string
	// stations are keyed by station ID
	stations: Record<number, Station>
	lastUpdated: string
	online?: boolean
}

export const stationUpdateSchema = stationSchema.omit({
	id: true,
	status: true,
	schedules: true,
	type: true,
})

// Combined area data structure for editing
export const areaUpdatePayloadSchema = z.object({
	// API side fields
	id: z.number().positive(),
	friendlyName: z.string().optional(),
	locationLabel: z.string().optional(),
	locationCoordinates: z.string().optional(),
	description: z.string().optional(),
	imageUrl: z.url().optional(),
	// MQTT side fields (stations are keyed by station ID)
	stations: z.record(z.number(), stationUpdateSchema),
})

export type AreaUpdatePayload = z.infer<typeof areaUpdatePayloadSchema>

export interface StationAction {
	action: MqttAction
	cause: MqttCause
	durationMs: number
}

export interface PendingStationAction extends StationAction {
	previousState: StationStatus['state']
}
