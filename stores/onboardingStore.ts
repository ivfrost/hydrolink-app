import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OnboardingState {
	hasOnboarded: boolean
	setHasOnboarded: (value: boolean) => void
}

export const useOnboarding = create(
	persist<OnboardingState>(
		(set) => ({
			hasOnboarded: false,
			setHasOnboarded: (value: boolean) => set({ hasOnboarded: value }),
		}),
		{
			name: 'oboarding-store',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
)
