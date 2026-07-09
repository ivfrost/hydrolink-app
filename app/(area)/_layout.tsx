import { Stack } from 'expo-router'

import { useTheme } from '@/context/ThemeContext'

export default function AreaLayout() {
	const theme = useTheme()
	return (
		<Stack>
			<Stack.Screen
				name="scan"
				options={{
					headerShown: true,
					headerShadowVisible: false,
					animation: 'slide_from_right',
					headerTitle: 'Scan QR Code',
					contentStyle: {
						backgroundColor: theme.colors.background,
					},
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
				}}
			/>
			<Stack.Screen
				name="areas/[key]"
				options={{
					headerTitle: '',
					headerShown: true,
					headerShadowVisible: false,
					contentStyle: {
						backgroundColor: theme.colors.background,
					},
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
				}}
			/>
		</Stack>
	)
}
