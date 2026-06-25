import { Stack } from 'expo-router'
import { useTheme } from '@/theme'
import { StatusBar } from 'expo-status-bar'
import { useOnboarding } from '@/stores/onboardingStore'

export default function RootLayout() {
	const theme = useTheme()
	const hasOnboarded = useOnboarding().hasOnboarded

	return (
		<>
			<StatusBar style="dark" />
			<Stack
				screenOptions={{
					contentStyle: { backgroundColor: theme.background },
					headerStyle: { backgroundColor: theme.card },
					headerTintColor: theme.textPrimary,
				}}
			>
				{hasOnboarded ? (
					<Stack.Screen
						name="(tabs)"
						options={{ headerShown: false, animation: 'fade' }}
					/>
				) : (
					<Stack.Screen
						name="onboarding/step1"
						options={{
							title: 'Onboarding',
							headerShown: false,
						}}
					/>
				)}
			</Stack>
		</>
	)
}
