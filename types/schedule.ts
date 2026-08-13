export interface TimeWindowResponse {
	id: number
	pin: number
	startType: string
	fixedTime: string
	linkedPin: number
	offsetMinutes: number
	durationMinutes: number
	hasConflict: boolean
}
export interface TimeWindowRequest {
	pin: number
	startType: string
	fixedTime: string
	linkedPin: number
	linkedReferencePoint: 'start' | 'end'
	offsetMinutes: number
	durationMinutes: number
}
export interface Schedule {
	id: number
	dayOfWeek: string
	windows: TimeWindowResponse[]
	conflictingWindowIds: number[]
}
