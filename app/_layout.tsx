import { TouchableOpacity } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import Toast from 'react-native-toast-message'

import { Ionicons } from '@expo/vector-icons'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { PortalProvider } from '@gorhom/portal'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { MqttProvider } from '@/context/MqttContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'

export const unstable_settings = {
	initialRouteName: '(tabs)',
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnMount: false,
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: false,
		},
	},
})

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

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<QueryClientProvider client={queryClient}>
				<BottomSheetModalProvider>
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
														size={24}
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
														size={24}
														color={theme.colors.textPrimary}
													/>
												</TouchableOpacity>
											),
										}}
									/>
								</Stack>
								<Toast />
								<StatusBar style="dark" />
							</MqttProvider>
						</KeyboardProvider>
					</PortalProvider>
				</BottomSheetModalProvider>
			</QueryClientProvider>
		</GestureHandlerRootView>
	)
}
