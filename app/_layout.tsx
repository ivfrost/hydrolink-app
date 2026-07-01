import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { Stack, useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'
import { TouchableOpacity } from 'react-native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { useEffect } from 'react'
import { Client } from 'paho-mqtt'

export const unstable_settings = {
	initialRouteName: 'index',
}

export const STICKY_BAR_HEIGHT = 90

const queryClient = new QueryClient()

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
		const client = new Client('ws://10.0.2.2:8083', 'expo-client-' + Date.now())

		client.connect({
			onSuccess: () => {
				console.log('MQTT connected')
				client.subscribe('hydro/1/HYDRO-AE70F/status')
			},
			onFailure: (err) => {
				console.log('MQTT connect failed', err)
			},
		})
	}, [])

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={queryClient}>
				<BottomSheetModalProvider>
					<PortalProvider>
						<KeyboardProvider>
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
													size={26}
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
													size={26}
													color={theme.colors.textPrimary}
												/>
											</TouchableOpacity>
										),
									}}
								/>
							</Stack>
							<Toast />
							<StatusBar style="dark" />
						</KeyboardProvider>
					</PortalProvider>
				</BottomSheetModalProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	)
}
