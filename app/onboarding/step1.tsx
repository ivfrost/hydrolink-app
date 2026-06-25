import HydroButton from '@/components/HydroButton'
import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import { Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Onboarding() {
	const toggleOnboarding = useOnboarding().toggleOnboarding
	const router = useRouter()

	const handleNextStep = () => {
		router.replace('/')
		toggleOnboarding()
	}

	return (
		<SafeAreaView style={styles.container}>
			<Text>Onboarding</Text>
			<HydroButton label="Let's get started" onPress={handleNextStep} />
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
})
