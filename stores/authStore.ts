import { create } from 'zustand'

interface AuthState {
	accessToken: string | undefined
	setAccessToken: (token: string) => void
	removeAccessToken: () => void
}

export const useAuth = create<AuthState>((set) => ({
	accessToken: undefined,
	setAccessToken: (token) => set({ accessToken: token }),
	removeAccessToken: () => set({ accessToken: undefined }),
}))
