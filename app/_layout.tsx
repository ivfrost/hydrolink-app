import { useEffect, useState } from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'

import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { fetchAuthSession } from 'aws-amplify/auth'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'

import { MqttProvider } from '@/context/MqttContext'
import { NetworkProvider } from '@/context/NetworkContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { asyncStoragePersister, queryClient } from '@/queries/queryClient'
import '@/services/amplify'

export const unstable_settings = {
	initialRouteName: '(tabs)',
}

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AppContent />
		</ThemeProvider>
	)
}

function AppContent() {
	const theme = useTheme()
	const router = useRouter()
	const segments = useSegments()
	const [authChecked, setAuthChecked] = useState(false)
	const isTabsRoute = segments[0] === '(tabs)'

	useEffect(() => {
		SystemUI.setBackgroundColorAsync(theme.colors.surface)
	}, [theme.colors.surface])

	useEffect(() => {
		let cancelled = false

		const checkAuth = async () => {
			let isAuthenticated = false
			try {
				const { tokens } = await fetchAuthSession()
				isAuthenticated = Boolean(tokens?.idToken)
			} catch {
				isAuthenticated = false
			}

			if (cancelled) return

			setAuthChecked(true)
			if (!isAuthenticated && isTabsRoute) {
				router.replace('/onboarding/onboarding2')
			}
		}

		void checkAuth()
		return () => {
			cancelled = true
		}
	}, [isTabsRoute, router])

	if (!authChecked) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: theme.colors.surface,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accent} />
			</View>
		)
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister: asyncStoragePersister,
					// Don't persist account-scoped data (linked devices, profile,
					// schedules) to AsyncStorage (stale data).
					// In-memory caching is unaffected.
					dehydrateOptions: {
						shouldDehydrateQuery: (query) =>
							query.queryKey[0] !== 'areas' &&
							query.queryKey[0] !== 'profile' &&
							query.queryKey[0] !== 'schedules',
					},
				}}
			>
				<BottomSheetModalProvider>
					<NetworkProvider>
						<MqttProvider>
							<PortalProvider>
								<KeyboardProvider>
									<Stack
										screenOptions={{
											contentStyle: {
												backgroundColor: theme.colors.surface,
											},
											headerStyle: {
												backgroundColor: theme.colors.surfaceRaised,
											},
											headerTintColor: theme.colors.textPrimary,
											headerShown: false,
										}}
									>
										<Stack.Screen
											name="(tabs)"
											options={{ headerShown: false, animation: 'fade' }}
										/>
										<Stack.Screen
											name="onboarding"
											options={{ headerShown: false }}
										/>
										<Stack.Screen
											name="(auth)/signin"
											options={{
												headerBackVisible: false,
												contentStyle: {
													backgroundColor: theme.colors.surfaceRaised,
												},
												headerShown: true,
												headerShadowVisible: false,
												animation: 'slide_from_bottom',
												headerTitle: '',
												headerRight: () => (
													<TouchableOpacity
														hitSlop={40}
														onPress={() => router.back()}
													>
														<Ionicons
															name="close"
															size={theme.space.iconSize}
															color={theme.colors.textPrimary}
														/>
													</TouchableOpacity>
												),
											}}
										/>
										<Stack.Screen
											name="(auth)/register"
											options={{
												headerBackVisible: false,
												contentStyle: {
													backgroundColor: theme.colors.surfaceRaised,
												},
												headerShown: true,
												headerShadowVisible: false,
												animation: 'slide_from_bottom',
												headerTitle: '',
												headerRight: () => (
													<TouchableOpacity
														hitSlop={40}
														onPress={() => router.back()}
													>
														<Ionicons
															name="close"
															size={theme.space.iconSize}
															color={theme.colors.textPrimary}
														/>
													</TouchableOpacity>
												),
											}}
										/>
									</Stack>
									<Toast />
									<StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
								</KeyboardProvider>
							</PortalProvider>
						</MqttProvider>
					</NetworkProvider>
				</BottomSheetModalProvider>
			</PersistQueryClientProvider>
		</GestureHandlerRootView>
	)
}
