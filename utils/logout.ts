import AsyncStorage from '@react-native-async-storage/async-storage'
import { signOut } from 'aws-amplify/auth'

import { queryCacheStorageKey } from '@/queries/queryClient'

// Handler to log the user out and clear their session data
export const logout = async (cb: () => void) => {
	try {
		await signOut()
	} catch (e) {
		console.warn('Amplify signOut failed:', e)
	}
	// Wipe the query cache (and its AsyncStorage copy) so the next
	// session/user can't see stale devices, profile data, etc. from
	// this one.
	await AsyncStorage.removeItem(queryCacheStorageKey)
	cb()
}
