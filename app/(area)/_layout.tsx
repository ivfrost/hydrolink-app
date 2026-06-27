import { Stack } from 'expo-router'

export default function AreaLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="scan"
				options={{
					headerShown: true,
					animation: 'slide_from_bottom',
					headerTitle: 'Scan QR Code',
				}}
			/>
		</Stack>
	)
}
