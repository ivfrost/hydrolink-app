import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Queries are cached for 24 hours
			gcTime: 1000 * 60 * 60 * 24,
		},
	},
})

// Key used for the persisted query cache. Kept in one place so logout can
// remove the persisted copy explicitly instead of relying on the default
// string ('REACT_QUERY_OFFLINE_CACHE') living in two files.
export const queryCacheStorageKey = 'REACT_QUERY_OFFLINE_CACHE'

export const asyncStoragePersister = createAsyncStoragePersister({
	storage: AsyncStorage,
	key: queryCacheStorageKey,
})
