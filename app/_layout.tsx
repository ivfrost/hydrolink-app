import { Stack, useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding } from '@/stores/onboardingStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

export const unstable_settings = {
	initialRouteName: 'index',
}

export default function RootLayout() {
	const theme = useTheme()
	const hasOnboarded = useOnboarding().hasOnboarded
	const queryClient = new QueryClient()
	const router = useRouter()

	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<StatusBar style="dark" />
				<Stack
					screenOptions={{
						contentStyle: { backgroundColor: theme.background },
						headerStyle: { backgroundColor: theme.card },
						headerTintColor: theme.textPrimary,
						headerShown: false,
					}}
				>
					{hasOnboarded ? (
						<Stack.Screen
							name="(tabs)"
							options={{ headerShown: false, animation: 'fade' }}
						/>
					) : (
						<Stack.Screen name="onboarding" options={{ headerShown: false }} />
					)}
					<Stack.Screen
						name="(auth)/signin"
						options={{
							headerBackVisible: false,
							contentStyle: {
								backgroundColor: theme.modalBackground,
							},
							headerShown: true,
							headerShadowVisible: false,
							animation: 'slide_from_bottom',
							headerTitle: '',
							headerRight: () => (
								<TouchableOpacity hitSlop={40} onPress={() => router.back()}>
									<Ionicons name="close" size={26} color={theme.textPrimary} />
								</TouchableOpacity>
							),
						}}
					/>
					<Stack.Screen
						name="(auth)/register"
						options={{
							headerBackVisible: false,
							contentStyle: {
								backgroundColor: theme.modalBackground,
							},
							headerShown: true,
							headerShadowVisible: false,
							animation: 'slide_from_bottom',
							headerTitle: '',
							headerRight: () => (
								<TouchableOpacity hitSlop={40} onPress={() => router.back()}>
									<Ionicons name="close" size={26} color={theme.textPrimary} />
								</TouchableOpacity>
							),
						}}
					/>
				</Stack>
				<Toast />
			</GestureHandlerRootView>
		</QueryClientProvider>
	)
}
