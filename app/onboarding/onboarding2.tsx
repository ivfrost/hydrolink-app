import HydroButton from '@/components/HydroButton'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import LoginIllustration from '@/assets/images/onboarding/undraw_login_weas.svg'
import { useEffect } from 'react'
import { useAuth } from '@/stores/authStore'
import HydroSubtitle from '@/components/HydroSubtitle'
import HydroTitle from '@/components/HydroTitle'
import HydroOnbTextWrapper from '@/components/HydroOnbTextWrapper'
import HydroButtonStackWrapper from '@/components/HydroButtonStackWrapper'
import HydroOnbContainer from '@/components/HydroOnbContainer'

export default function Onboarding2() {
	const router = useRouter()
	const theme = useTheme()
	const accessToken = useAuth().accessToken

	useEffect(() => {
		if (accessToken) {
			router.replace('/onboarding/onboarding3')
		}
	}, [router, accessToken])

	return (
		<HydroOnbContainer>
			<View
				style={{
					justifyContent: 'center',
					alignItems: 'center',
					gap: theme.space.xl,
				}}
			>
				<LoginIllustration
					width={260}
					height={290}
					color={theme.colors.accentBlue}
				/>
				<HydroOnbTextWrapper>
					<HydroTitle text="Sign in to your account" />
					<HydroSubtitle text="Your account keeps your devices together and under your control. An account is required to continue. You can create one for free." />
				</HydroOnbTextWrapper>
			</View>
			<HydroButtonStackWrapper>
				<HydroButton
					label="Sign In"
					onPress={() => router.push('/(auth)/signin')}
				/>
				<HydroButton
					label="Create Account"
					variant="secondary"
					onPress={() => router.push('/(auth)/register')}
				/>
			</HydroButtonStackWrapper>
		</HydroOnbContainer>
	)
}
