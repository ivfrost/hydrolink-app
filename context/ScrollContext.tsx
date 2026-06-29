import { createContext, useContext, useRef } from 'react'
import { Animated } from 'react-native'

const ScrollContext = createContext<Animated.Value | null>(null)

export function ScrollProvider({ children }: { children: React.ReactNode }) {
	const scrollY = useRef(new Animated.Value(0)).current
	return (
		<ScrollContext.Provider value={scrollY}>{children}</ScrollContext.Provider>
	)
}

export function useScrollY() {
	const ctx = useContext(ScrollContext)
	if (!ctx) throw new Error('useScrollY must be used within ScrollProvider')
	return ctx
}
