import { Stack } from 'expo-router'
import { useTheme } from '@/theme'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
	const theme = useTheme()

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
				<Stack.Screen
					name="(tabs)"
					options={{ headerShown: false, animation: 'fade' }}
				/>
			</Stack>
		</>
	)
}
