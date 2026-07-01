import { MaterialCommunityIcons } from '@expo/vector-icons'

export interface ActiveStationData {
	name: string
	time: string
}

export interface AreaDataItem {
	name: string
	activeStation: ActiveStationData
}

export interface AreaAction {
	label: string
	onPress: (index: number) => void
}

export type AreaCardVariant = 'active' | 'incoming'

export interface RecentActivityEvent {
	id: string
	title: string
	description: string
	time: string
	status: 'success' | 'warning' | 'fault' | 'info'
	icon: keyof typeof MaterialCommunityIcons.glyphMap
}
