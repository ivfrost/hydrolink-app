import { useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'

import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'

import { MqttProvider } from '@/context/MqttContext'
import { NetworkProvider } from '@/context/NetworkContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { asyncStoragePersister, queryClient } from '@/queries/queryClient'

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

	useEffect(() => {
		SystemUI.setBackgroundColorAsync(theme.colors.background)
	}, [theme.colors.background])

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<PersistQueryClientProvider
				client={queryClient}
				persistOptions={{
					persister: asyncStoragePersister,
					// Don't persist account-scoped data (linked devices, profile,
					// schedules) to AsyncStorage. Persisting these makes stale data —
					// e.g. a device unlinked elsewhere, or another user's data after
					// logout — reappear on the next launch before a fresh
					// refetch succeeds (or forever, if the refetch fails).
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
						<PortalProvider>
							<KeyboardProvider>
								<MqttProvider>
									<Stack
										screenOptions={{
											contentStyle: {
												backgroundColor: theme.colors.background,
											},
											headerStyle: { backgroundColor: theme.colors.card },
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
													backgroundColor: theme.colors.card,
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
													backgroundColor: theme.colors.card,
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
								</MqttProvider>
							</KeyboardProvider>
						</PortalProvider>
					</NetworkProvider>
				</BottomSheetModalProvider>
			</PersistQueryClientProvider>
		</GestureHandlerRootView>
	)
}
