import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import LoginIllustration from '@/assets/images/onboarding/undraw_login_weas.svg'
import { useEffect } from 'react'
import { useAuth } from '@/stores/authStore'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import ButtonColumnWrapper from '@/components/layout/ButtonColumnWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'

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
		<OnboardContainer>
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
				<OnboardTextWrapper>
					<Title text="Sign in to your account" />
					<Subtitle text="Your account keeps your devices together and under your control. An account is required to continue. You can create one for free." />
				</OnboardTextWrapper>
			</View>
			<ButtonColumnWrapper>
				<Button label="Sign In" onPress={() => router.push('/(auth)/signin')} />
				<Button
					label="Create Account"
					variant="secondary"
					onPress={() => router.push('/(auth)/register')}
				/>
			</ButtonColumnWrapper>
		</OnboardContainer>
	)
}
