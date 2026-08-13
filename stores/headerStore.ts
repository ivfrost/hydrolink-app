import { create } from 'zustand'

interface HeaderStore {
	/** 0..1 — how far the area header has scrolled past the hero image. */
	areaHeaderOpacity: number
	setAreaHeaderOpacity: (opacity: number) => void
}

export const useHeaderStore = create<HeaderStore>((set) => ({
	areaHeaderOpacity: 0,
	setAreaHeaderOpacity: (opacity) => set({ areaHeaderOpacity: opacity }),
}))
