import { Stack } from 'expo-router'

export default function SettingsLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerTransparent: true,
			}}
		>
			<Stack.Screen name="profile" options={{ headerTitle: 'Profile' }} />
		</Stack>
	)
}
