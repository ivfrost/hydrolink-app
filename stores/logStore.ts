import { create } from 'zustand'

import { MAX_LOGS_PER_AREA } from '@/constants'

interface LogEntry {
	id: number
	payload: string
}

interface LogStore {
	// logs are keyed by areaKey
	logs: Map<string, LogEntry[]>
	addLog: (areaKey: string, payload: string) => void
	getLogs: (areaKey: string) => LogEntry[]
}

// Stable reference so selectors for areas with no logs yet don't produce a
// fresh array on every store update (which would re-render on any message).
const EMPTY_LOGS: LogEntry[] = []

let nextId = 0

export const useLogStore = create<LogStore>((set, get) => ({
	logs: new Map<string, LogEntry[]>(),
	addLog: (areaKey: string, payload: string) => {
		const log: LogEntry = { id: nextId++, payload }
		set((state) => {
			const currentLogs = state.logs.get(areaKey) || []
			const updatedLogs = [...currentLogs, log].slice(-MAX_LOGS_PER_AREA)
			const newLogsMap = new Map(state.logs)
			newLogsMap.set(areaKey, updatedLogs)
			return { logs: newLogsMap }
		})
	},
	getLogs: (areaKey: string) => {
		return get().logs.get(areaKey) ?? EMPTY_LOGS
	},
}))
