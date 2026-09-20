import { Stack } from 'expo-router'

import { useTheme } from '@/context/ThemeContext'

export default function SchedulesLayout() {
	const theme = useTheme()

	return (
		<Stack
			screenOptions={{
				headerTintColor: theme.colors.textPrimary,
			}}
		>
			<Stack.Screen
				name="schedules/new"
				options={{
					headerShown: true,
					headerShadowVisible: false,
					animation: 'slide_from_bottom',
					headerTitle: 'New Schedule',
					headerTransparent: true,
					contentStyle: { backgroundColor: theme.colors.surface },
					headerStyle: { backgroundColor: 'transparent' },
				}}
			/>
		</Stack>
	)
}
