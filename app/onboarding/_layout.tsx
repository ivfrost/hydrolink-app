import { Ionicons } from '@expo/vector-icons'
import { Stack, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'

export default function Layout() {
	const router = useRouter()
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
					title: 'Recovery Codes',
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
