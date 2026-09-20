export type TimeWindowStartType = 'FIXED' | 'RELATIVE'

export type LinkedReferencePoint = 'START' | 'END'

export interface TimeWindowResponse {
	id: number
	pin: number
	startType: TimeWindowStartType
	fixedTime: string | null
	linkedPin: number | null
	linkedReferencePoint?: LinkedReferencePoint | null
	offsetMinutes: number | null
	durationMinutes: number
}

/**
 * Window payload for PUT /devices/{key}/schedules/{date}.
 * When startType is FIXED, fixedTime is required.
 * When startType is RELATIVE, linkedPin, linkedReferencePoint and offsetMinutes
 * are required.
 */
export interface TimeWindowRequest {
	pin: number
	startType: TimeWindowStartType
	fixedTime?: string
	linkedPin?: number
	linkedReferencePoint?: LinkedReferencePoint
	offsetMinutes?: number
	durationMinutes: number
}

export interface Schedule {
	id: number
	/** ISO date (yyyy-MM-dd). Schedules are stored per concrete date. */
	date: string
	windows: TimeWindowResponse[]
	conflictingWindowIds: number[]
}
