import { View, Alert, Text } from 'react-native'

import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import * as Burnt from 'burnt'
import { Directory } from 'expo-file-system'
import { useLocalSearchParams, useRouter } from 'expo-router'

import OnboardContainer from '@/components/onboard/OnboardContainer'
import OnboardTextWrapper from '@/components/onboard/OnboardTextWrapper'
import Button from '@/components/ui/Button'
import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'

export default function OnboardingStep3() {
	const theme = useTheme()
	const router = useRouter()
	const { recoveryCodes } = useLocalSearchParams()
	const codes: string[] = recoveryCodes
		? JSON.parse(recoveryCodes as string)
		: []

	const handleConfirmation = () => {
		Alert.alert(
			'Have you saved your recovery codes?',
			'Please confirm that you have saved your recovery codes before proceeding.',
			[
				{
					text: 'Yes, I have saved them',
					onPress: () => {
						// Handle the case when the user confirms they have saved their recovery codes
						router.push('/onboarding/onboarding4')
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

	const downloadCodes = async () => {
		const codesString = codes.join('\n')

		try {
			// Prompt the user to select their desired directory location
			const selectedDir = await Directory.pickDirectoryAsync()

			// If user cancels the prompt picker dialog
			if (!selectedDir) {
				console.log('User cancelled directory selection')
				return
			}

			// Generate randomized filename
			const suffix = Math.random().toString(36).slice(2, 8)
			const filename = `recovery_codes_${suffix}.txt`

			// Create the file in the selected directory and write the recovery codes to it
			const file = selectedDir.createFile(filename, 'text/plain')
			file.write(codesString)

			// Alert the user it successfully saved
			Burnt.toast({
				title: 'Codes saved successfully!',
				preset: 'done',
			})

			console.log(`Recovery codes saved to: ${file.uri}`)
		} catch (error) {
			console.error('Error selecting directory or saving file:', error)
			Burnt.toast({
				title: 'Failed to save recovery codes.',
				preset: 'error',
			})
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
						width: '100%',
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
						modifier={['full']}
						icon={
							<MaterialIcons
								name="download"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
					/>
				</View>

				<Button
					label="Continue"
					variant="secondary"
					modifier={['tall', 'full']}
					iconPosition="right"
					onPress={handleConfirmation}
					icon={
						<MaterialIcons
							name="arrow-forward"
							size={24}
							color={theme.colors.buttonSecondaryText}
						/>
					}
				/>
			</View>
		</OnboardContainer>
	)
}
