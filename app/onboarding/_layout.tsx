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
				headerLeft: () => (
					<TouchableOpacity
						hitSlop={40}
						onPress={() => router.back()}
						style={{ marginRight: 16 }}
					>
						<Ionicons name="arrow-back" size={24} color="black" />
					</TouchableOpacity>
				),
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
					title: 'Link Device',
				}}
			/>
		</Stack>
	)
}
