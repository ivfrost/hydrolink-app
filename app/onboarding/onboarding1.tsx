import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import WebDevicesIllustration from '@/assets/images/onboarding/undraw_web-devices_i15y.svg'
import { useAuth } from '@/stores/authStore'
import Title from '@/components/ui/Title'
import Subtitle from '@/components/ui/Subtitle'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'

export default function Onboarding1() {
	const router = useRouter()
	const theme = useTheme()
	const accessToken = useAuth().accessToken

	const handleNextStep = () => {
		if (accessToken) {
			router.push('/onboarding/onboarding3')
		} else {
			router.push('/onboarding/onboarding2')
		}
	}

	return (
		<OnboardContainer>
			<Text
				style={{
					fontSize: theme.font.xl,
					fontWeight: '500',
					color: theme.colors.textPrimary,
					letterSpacing: -0.4,
					textAlign: 'center',
				}}
			>
				Hydrolink
			</Text>
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.xl,
				}}
			>
				<WebDevicesIllustration
					width={300}
					height={230}
					color={theme.colors.accentBlue}
				/>
				<OnboardTextWrapper>
					<Title text="All your valves, one app." />
					<Subtitle text="Connect every controller, zone, and sensor across your garden — and water smarter, automatically." />
				</OnboardTextWrapper>
			</View>
			<Button label="Let's Get Started" onPress={handleNextStep} />
		</OnboardContainer>
	)
}
