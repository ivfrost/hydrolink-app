import { Text, View } from 'react-native'

import { fetchAuthSession } from '@aws-amplify/core'
import { useRouter } from 'expo-router'

import WebDevicesIllustration from '@/assets/images/onboarding/undraw_web-devices_i15y.svg'
import OnboardContainer from '@/components/onboard/OnboardContainer'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Button from '@/components/ui/Button'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

export default function OnboardingStep1() {
	const router = useRouter()
	const theme = useTheme()

	const handleNextStep = () => {
		// TODO: check whether the user already has linked areas and skip
		const checkToken = async () => {
			await fetchAuthSession()
		}
		try {
			checkToken()
			// router.replace('/onboarding/onboarding4')
		} catch {
			router.push('/onboarding/onboarding2')
		}
	}

	return (
		<OnboardContainer>
			<Text
				style={{
					fontSize: theme.font.xl,
					fontWeight: theme.fontWeight.medium,
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
					color={theme.colors.accent}
				/>
				<OnboardTextWrapper>
					<Title text={t('onboarding.welcomeTitle')} />
					<Subtitle text={t('onboarding.welcomeSubtitle')} />
				</OnboardTextWrapper>
			</View>
			<Button label={t('onboarding.getStarted')} onPress={handleNextStep} />
		</OnboardContainer>
	)
}
