import { Stack } from 'expo-router'

export default function Layout() {
	return (
		<Stack
			screenOptions={{
				headerShown: true,
				animation: 'slide_from_right',
				headerTransparent: true,
				headerShadowVisible: false,
			}}
		>
			<Stack.Screen
				name="onboarding1"
				options={{
					title: 'Welcome',
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="onboarding2"
				options={{
					title: 'Sign In',
				}}
			/>
			<Stack.Screen
				name="onboarding3"
				options={{
					presentation: 'modal',
					title: '',
					headerLeft: () => null,
				}}
			/>
			<Stack.Screen
				name="onboarding4"
				options={{
					title: 'Link Device',
					headerLeft: () => null,
				}}
			/>
		</Stack>
	)
}
