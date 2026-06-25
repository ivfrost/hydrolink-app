import { User } from '@/types/user'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface AuthState {
	user: User | undefined
	setUser: (user: User) => void
	removeUser: () => void
}

export const useAuth = create(
	persist<AuthState>(
		(set) => ({
			user: undefined,
			setUser: (user) => set({ user }),
			removeUser: () => set({ user: undefined }),
		}),
		{
			name: 'auth-store',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
)
