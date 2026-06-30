import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import WebDevicesIllustration from '@/assets/images/onboarding/undraw_web-devices_i15y.svg'
import { useAuth } from '@/stores/authStore'
import HydroTitle from '@/components/HydroTitle'
import HydroSubtitle from '@/components/HydroSubtitle'
import HydroOnbTextWrapper from '@/components/HydroOnbTextWrapper'
import HydroOnbContainer from '@/components/HydroOnbContainer'

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
		<HydroOnbContainer>
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
				<HydroOnbTextWrapper>
					<HydroTitle text="All your valves, one app." />
					<HydroSubtitle text="Connect every controller, zone, and sensor across your garden — and water smarter, automatically." />
				</HydroOnbTextWrapper>
			</View>
			<HydroButton label="Let's Get Started" onPress={handleNextStep} />
		</HydroOnbContainer>
	)
}
