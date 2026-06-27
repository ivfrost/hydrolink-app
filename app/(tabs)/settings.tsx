import HydroButton from '@/components/HydroButton'
import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import { View, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'

export default function SettingsScreen() {
	const toggleOnboarding = useOnboarding().toggleOnboarding
	const router = useRouter()
	const resetOnboarding = () => {
		toggleOnboarding()
		router.replace('/onboarding/onboarding1')
	}
	const { data: profile, isPending, error } = useQuery(profileQuery)

	return (
		<View>
			<HydroButton label="Let's get started" onPress={resetOnboarding} />
			<View>
				{isPending && <Text>Loading profile...</Text>}
				{error && <Text>Error fetching profile: {error.message}</Text>}
				{profile && <Text>Profile data: {JSON.stringify(profile)}</Text>}
			</View>
		</View>
	)
}
