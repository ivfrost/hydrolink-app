import { Stack } from 'expo-router'

import { useTheme } from '@/context/ThemeContext'

export default function SettingsLayout() {
	const theme = useTheme()

	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerShadowVisible: false,
				animation: 'slide_from_right',
				contentStyle: {
					backgroundColor: theme.colors.background,
				},
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
			}}
		>
			<Stack.Screen name="profile" options={{ headerTitle: '' }} />
			<Stack.Screen
				name="change-email"
				options={{
					headerTitle: '',
					presentation: 'modal',
					animation: 'slide_from_right',
				}}
			/>
			<Stack.Screen
				name="change-password"
				options={{
					headerTitle: '',
					presentation: 'modal',
					animation: 'slide_from_right',
				}}
			/>
		</Stack>
	)
}
