import HydroButton from '@/components/HydroButton'
import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import { View } from 'react-native'

export default function SettingsScreen() {
	const toggleOnboarding = useOnboarding().toggleOnboarding
	const router = useRouter()
	const resetOnboarding = () => {
		toggleOnboarding()
		router.replace('/onboarding/onboarding1')
	}
	return (
		<View>
			<HydroButton label="Let's get started" onPress={resetOnboarding} />
		</View>
	)
}
