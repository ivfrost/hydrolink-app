import { Stack, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function Layout() {
	const router = useRouter()
	return (
		<Stack
			screenOptions={{
				headerShown: false,
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
					title: 'Link Device',
					headerTransparent: true,
					headerShadowVisible: false,
					headerTitle: 'Back',
					headerLeft: () => (
						<TouchableOpacity
							hitSlop={40}
							onPress={() => router.back()}
							style={{ marginRight: 16 }}
						>
							<Ionicons name="arrow-back" size={24} color="black" />
						</TouchableOpacity>
					),
					animation: 'slide_from_right',
				}}
			/>
		</Stack>
	)
}
