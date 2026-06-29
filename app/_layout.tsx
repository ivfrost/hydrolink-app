import { Stack, useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding } from '@/stores/onboardingStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ScrollProvider } from '@/context/ScrollContext'

export const unstable_settings = {
	initialRouteName: 'index',
}

const queryClient = new QueryClient()

export default function RootLayout() {
	const theme = useTheme()
	const hasOnboarded = useOnboarding().hasOnboarded
	const router = useRouter()

	return (
		<ScrollProvider>
			<QueryClientProvider client={queryClient}>
				<BottomSheetModalProvider>
					<GestureHandlerRootView style={{ flex: 1 }}>
						<StatusBar style="dark" />
						<Stack
							screenOptions={{
								contentStyle: {
									backgroundColor: theme.background,
								},
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
								<Stack.Screen
									name="onboarding"
									options={{ headerShown: false }}
								/>
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
										<TouchableOpacity
											hitSlop={40}
											onPress={() => router.back()}
										>
											<Ionicons
												name="close"
												size={26}
												color={theme.textPrimary}
											/>
										</TouchableOpacity>
									),
								}}
							/>
							<Stack.Screen
								name="settings/profile"
								options={{
									headerBackVisible: true,
									contentStyle: {
										backgroundColor: theme.modalBackground,
									},
									headerShown: true,
									headerShadowVisible: false,
									animation: 'slide_from_right',
									headerTitle: 'Profile',
								}}
							/>
							<Stack.Screen
								name="settings/change-password"
								options={{
									headerBackVisible: true,
									contentStyle: {
										backgroundColor: theme.modalBackground,
									},
									headerShown: true,
									headerShadowVisible: false,
									animation: 'slide_from_right',
									headerTitle: 'Change Password',
								}}
							/>
						</Stack>
						<Toast />
					</GestureHandlerRootView>
				</BottomSheetModalProvider>
			</QueryClientProvider>
		</ScrollProvider>
	)
}
