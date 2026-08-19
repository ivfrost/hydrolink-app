import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useHeaderHeight } from 'expo-router/build/react-navigation'

import AreasTabScreen from '@/components/areas/AreasTabScreen'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useNetwork } from '@/context/NetworkContext'
import { useTheme } from '@/context/ThemeContext'
import { useLocalDiscovery } from '@/hooks/useLocalDiscovery'
import { areaLinkMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { useAreaStore } from '@/stores/areaStore'
import { AppError } from '@/types/api'

export default function AreaTabScreen() {
	const queryClient = useQueryClient()
	const theme = useTheme()
	const bottomSheetRef = useRef<BottomSheetMethods>(null)
	const router = useRouter()
	const [linkCode, setLinkCode] = useState('')
	const [isRefreshing, setIsRefreshing] = useState(false)
	const headerHeight = useHeaderHeight()
	const { scanned } = useLocalSearchParams<{ scanned?: string }>()
	const { reconnect: reconnectMqtt, requestStatusSnapshot } = useMqtt()
	const { rescan: rescanLocal } = useLocalDiscovery()

	// Query for fetching user's areas
	const {
		data: areas,
		isPending: areasPending,
		error: areaLoadError,
	} = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
		// Keep the linked-devices list in sync with the server without a
		// manual pull-to-refresh while the tab is open.
		refetchInterval: 30_000,
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	})

	const mqttAreas = useAreaStore((state) => state.areas)
	const isAreaOnline = useAreaStore((state) => state.isOnline)
	const { isNetworkConnected, isInternetReachable } = useNetwork()
	const isOffline = !isNetworkConnected || !isInternetReachable
	const canUseRemoteLinking = Boolean(isNetworkConnected && isInternetReachable)
	const canUseLocalDiscovery = Boolean(isNetworkConnected)

	// // Keep the latest snapshot-request callback in a ref so the focus effect
	// // below stays stable (the callback's identity changes on every render).
	// // The ref is updated inside an effect to satisfy React's rules (no ref
	// // writes during render).
	// const requestStatusSnapshotRef = useRef(requestStatusSnapshot)
	// useEffect(() => {
	// 	requestStatusSnapshotRef.current = requestStatusSnapshot
	// }, [requestStatusSnapshot])

	// // Auto-sync whenever the Areas tab regains focus: refetch the linked
	// // devices list and request a fresh MQTT status snapshot, so area updates
	// // (links, renames, unlinks, status) appear without pulling to refresh.
	// useFocusEffect(
	// 	useCallback(() => {
	// 		queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
	// 		requestStatusSnapshotRef.current()
	// 	}, [queryClient]),
	// )

	// Mutation for linking an area
	const { mutate, isPending: linkPending } = useMutation({
		mutationKey: ['linkArea'],
		mutationFn: areaLinkMutationFn,
		onError: (error: AppError) => {
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred. Please try again later.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: async () => {
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
			queryClient.refetchQueries({ queryKey: ['areas'] })
			reconnectMqtt()
			bottomSheetRef.current?.close()
			setLinkCode('')
		},
	})

	// Handler for submitting the link code
	const handleLinkCodeSubmit = useCallback(() => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
			return
		}
		mutate(linkCode)
	}, [linkCode, mutate])

	// Handler to refresh areas data on pull-to-refresh
	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
			reconnectMqtt()
			rescanLocal()
		} catch (error) {
			console.error('Error refreshing areas:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	// Effect to handle received scanned code from QR scanner
	useEffect(() => {
		if (!scanned) return

		const cleanedCode = scanned.trim()

		if (cleanedCode.length === 32) {
			mutate(cleanedCode)
		} else {
			Burnt.toast({ title: 'The Link Code must be 32 characters long' })
		}

		// Clear the navigation parameter immediately so the same code
		// doesn't accidentally re-execute if the screen re-focuses
		router.setParams({ scanned: undefined })
	}, [scanned, mutate, router])

	// Handler to go to the QR code scanner screen
	const handleGoScan = async () => {
		bottomSheetRef.current?.close()
		router.push({ pathname: '/(area)/scan', params: { from: 'areas' } })
	}

	// Loading state while areas are being fetched
	if (areasPending) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accent} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading areas…
				</Text>
			</View>
		)
	}

	return (
		<AreasTabScreen
			areas={areas ?? []}
			mqttAreas={mqttAreas}
			isAreaOnline={isAreaOnline}
			isRefreshing={isRefreshing}
			onRefresh={onRefresh}
			linkCode={linkCode}
			setLinkCode={setLinkCode}
			onLinkCodeSubmit={handleLinkCodeSubmit}
			onScanPress={handleGoScan}
			onAddPress={() => bottomSheetRef.current?.expand()}
			onAreaPress={(areaKey) => router.push(`/areas/${areaKey}`)}
			linkPending={linkPending}
			bottomSheetRef={bottomSheetRef}
			headerHeight={headerHeight}
			isOffline={isOffline}
			hasServerError={!!areaLoadError}
			canUseRemoteLinking={canUseRemoteLinking}
			canUseLocalDiscovery={canUseLocalDiscovery}
			onDiscoverPress={() => {
				// Hook local discovery here next.
			}}
		/>
	)
}
