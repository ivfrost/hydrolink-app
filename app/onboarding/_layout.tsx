import { Stack } from 'expo-router'

export default function Layout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				animation: 'slide_from_right',
			}}
		>
			<Stack.Screen
				name="onboarding1"
				options={{
					title: 'Welcome',
					headerShown: false,
					animation: 'slide_from_right',
				}}
			/>
			<Stack.Screen
				name="onboarding2"
				options={{
					title: 'Sign In',
					headerTransparent: true,
					headerShadowVisible: false,
				}}
			/>
			<Stack.Screen
				name="onboarding3"
				options={{
					title: 'Link Device',
					headerTransparent: true,
					headerShadowVisible: false,
				}}
			/>
		</Stack>
	)
}
