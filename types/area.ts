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
	key: string
	name: string
	location: string
	description: string
	imageUrl?: string
}
