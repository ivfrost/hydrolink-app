import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react'

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'

interface NetworkContextValue {
	isNetworkConnected: boolean
	isInternetReachable: boolean | null
}

const NetworkContext = createContext<NetworkContextValue>({
	isNetworkConnected: true,
	isInternetReachable: true,
})

export function NetworkProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<NetInfoState | null>(null)

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener(setState)
		NetInfo.fetch().then(setState)
		return unsubscribe
	}, [])

	return (
		<NetworkContext.Provider
			value={{
				isNetworkConnected: state?.isConnected ?? true,
				isInternetReachable: state?.isInternetReachable ?? null,
			}}
		>
			{children}
		</NetworkContext.Provider>
	)
}

export const useNetwork = () => useContext(NetworkContext)
