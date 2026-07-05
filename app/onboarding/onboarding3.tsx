import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'
import { View, Alert, Text } from 'react-native'
import RecoveryCodesIllustration from '@/assets/images/onboarding/undraw_vault_tyfh.svg'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import ButtonColumnWrapper from '@/components/layout/ButtonColumnWrapper'
import OnboardContainer from '@/components/onboard/OnboardContainer'
import * as Burnt from 'burnt'
import { useLocalSearchParams } from 'expo-router'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { File, Paths } from 'expo-file-system'

export default function Onboarding4() {
	const theme = useTheme()
	const { recoveryCodes } = useLocalSearchParams()
	const codes: string[] = recoveryCodes
		? JSON.parse(recoveryCodes as string)
		: []

	const handleConfirmation = () => {
		const response = Alert.alert(
			'Have you saved your recovery codes?',
			'Please confirm that you have saved your recovery codes before proceeding.',
			[
				{
					text: 'Yes, I have saved them',
					onPress: () => {
						// Handle the case when the user confirms they have saved their recovery codes
						console.log('User confirmed they have saved their recovery codes.')
					},
				},
				{
					text: "No, I haven't saved them",
					onPress: () => {
						// Handle the case when the user indicates they haven't saved their recovery codes
						console.log(
							"User indicated they haven't saved their recovery codes.",
						)
						Burnt.dismissAllAlerts()
						Burnt.toast({
							title: 'You must save your recovery codes before proceeding.',
							preset: 'error',
						})
					},
				},
			],
		)
	}

	const downloadCodes = () => {
		const codesString = codes.join('\n')
		try {
			const suffix = Math.random().toString(36).slice(2, 8)
			const filename = `recovery_codes_${suffix}.txt`
			const file = new File(Paths.document, filename)
			file.create()
			file.write(codesString)
			console.log(`Recovery codes saved to ${file.uri}`)
			console.log(file.textSync())
		} catch (error) {
			console.error('Error saving recovery codes:', error)
		}
	}

	return (
		<OnboardContainer>
			<View
				style={{
					justifyContent: 'space-evenly',
					alignItems: 'center',
					gap: theme.space.lg,
					paddingVertical: theme.space.x3l,
					flex: 1,
					width: '100%',
				}}
			>
				<RecoveryCodesIllustration
					height={160}
					width={310}
					color={theme.colors.accentBlue}
				/>
				<OnboardTextWrapper>
					<Title text="Save your recovery codes" />
					<Subtitle>
						These{' '}
						<Text
							style={{
								fontVariant: ['small-caps'],
								color: theme.colors.textPrimary,
								fontWeight: '500',
							}}
						>
							Recovery Codes
						</Text>{' '}
						will allow you to regain access to your account in case you forget
						your password. Please save them in a secure location.
					</Subtitle>
				</OnboardTextWrapper>
				<View
					style={{
						backgroundColor: theme.colors.card,
						borderRadius: theme.radius.card,
						gap: theme.space.md,
						padding: theme.space.lg,
					}}
				>
					{codes.map((code, idx) => {
						// Break into 4-char chunks
						const formatted = code.match(/.{1,4}/g)?.join(' ') ?? code
						return (
							<View
								key={idx}
								style={{
									padding: theme.space.sm,
									backgroundColor: '#f5f7fa',
									borderRadius: 8,
									alignItems: 'center',
								}}
							>
								<Text
									style={{
										fontFamily: 'monospace',
										fontSize: theme.font.base,
										letterSpacing: 2,
									}}
								>
									{formatted}
								</Text>
							</View>
						)
					})}
					<Button
						label="Download codes"
						onPress={downloadCodes}
						icon={
							<MaterialIcons
								name="download"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				</View>

				<ButtonColumnWrapper>
					<Button
						label="I have saved my recovery codes"
						variant="secondary"
						iconPosition="right"
						onPress={handleConfirmation}
						icon={
							<MaterialIcons
								name="check"
								size={24}
								color={theme.colors.buttonSecondaryText}
							/>
						}
					/>
				</ButtonColumnWrapper>
			</View>
		</OnboardContainer>
	)
}
