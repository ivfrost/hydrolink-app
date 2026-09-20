import { useEffect } from 'react'
import { View } from 'react-native'

import { fetchAuthSession } from '@aws-amplify/core'
import { useRouter } from 'expo-router'

import LoginIllustration from '@/assets/images/onboarding/undraw_login_weas.svg'
import ButtonColumnWrapper from '@/components/layout/ButtonColumnWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Button from '@/components/ui/Button'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

export default function OnboardingStep2() {
	const router = useRouter()
	const theme = useTheme()

	useEffect(() => {
		// TODO: check whether the user already has linked areas and skip
		const checkToken = async () => {
			await fetchAuthSession()
		}
		try {
			checkToken()
			// router.replace('/onboarding/onboarding4')
		} catch {
			// User has no token so they can stay on this screen
		}
	}, [router])

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
					color={theme.colors.accent}
				/>
				<OnboardTextWrapper>
					<Title text={t('onboarding.signInTitle')} />
					<Subtitle text={t('onboarding.signInSubtitle')} />
				</OnboardTextWrapper>
			</View>
			<ButtonColumnWrapper>
				<Button
					label={t('onboarding.signIn')}
					onPress={() => router.push('/(auth)/signin')}
				/>
				<Button
					label={t('onboarding.createAccount')}
					variant="tertiary"
					onPress={() => router.push('/(auth)/register')}
				/>
			</ButtonColumnWrapper>
		</OnboardContainer>
	)
}
