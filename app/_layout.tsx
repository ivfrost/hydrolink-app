import { Stack } from 'expo-router'
import { useTheme } from '@/theme'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding } from '@/stores/onboardingStore'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
	const theme = useTheme()
	const hasOnboarded = useOnboarding().hasOnboarded

	return (
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
					<Stack.Screen
						name="onboarding"
						options={{
							title: 'Onboarding',
							headerShown: false,
						}}
					/>
				)}
			</Stack>
		</GestureHandlerRootView>
	)
}
