import HydroButton from '@/components/HydroButton'
import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import { View, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export default function SettingsScreen() {
	const toggleOnboarding = useOnboarding().toggleOnboarding
	const router = useRouter()
	const resetOnboarding = () => {
		toggleOnboarding()
		router.replace('/onboarding/onboarding1')
	}
	const getProfileFn = async () => {
		try {
			const response = await fetch(`${API_BASE_URL}/me`)
			if (!response.ok) {
				throw new Error('PROFILE_FETCH_FAILED')
			}
			return await response.json()
		} catch (e) {
			if (e instanceof TypeError) {
				throw new Error('NETWORK_ERROR')
			}
			throw e
		}
	}
	const { data, isLoading, error } = useQuery({
		queryKey: ['profile'],
		queryFn: getProfileFn,
	})

	return (
		<View>
			<HydroButton label="Let's get started" onPress={resetOnboarding} />
			<View>
				{isLoading && <Text>Loading profile...</Text>}
				{error && <Text>Error fetching profile: {error.message}</Text>}
				{data && <Text>Profile data: {JSON.stringify(data)}</Text>}
			</View>
		</View>
	)
}
