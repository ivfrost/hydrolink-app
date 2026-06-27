import HydroButton from '@/components/HydroButton'
import HydroInput from '@/components/HydroInput'
import { useTheme } from '@/theme'
import { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Burnt from 'burnt'
import { MaterialIcons } from '@expo/vector-icons'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

const registerSchema = z.object({
	email: z.email(),
	username: z.string().min(5).max(20),
	fullName: z.string().min(6).max(40),
	password: z.string().min(8).max(42),
	preferredLanguage: z.string().length(2),
})

type RegisterInput = z.infer<typeof registerSchema>
type ErrorState = Partial<Record<keyof RegisterInput, string>>

export default function Register() {
	const [inputState, setInputState] = useState({
		email: '',
		username: '',
		fullName: '',
		password: '',
		preferredLanguage: 'en',
	})
	const [errorState, setErrorState] = useState<ErrorState>({})
	const theme = useTheme()
	const router = useRouter()

	const registerFn = async (input: RegisterInput): Promise<void> => {
		try {
			const response = await fetch(`${API_BASE_URL}/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(input),
			})
			console.log('Register response:', response)
			if (!response.ok) {
				throw new Error('REGISTER_FAILED')
			}
		} catch (e) {
			if (e instanceof TypeError) {
				throw new Error('NETWORK_ERROR')
			}
			throw e
		}
	}

	const { mutate, isPending } = useMutation({
		mutationKey: ['register'],
		mutationFn: registerFn,
		onError: (error) => {
			Burnt.toast({
				title:
					error.message === 'NETWORK_ERROR'
						? 'Could not connect to server'
						: 'Registration failed. Please try again.',
				preset: 'error',
			})
		},
		onSuccess: () => {
			router.replace('/(tabs)')
		},
	})

	const register = () => {
		const { success, error, data } = registerSchema.safeParse(inputState)

		if (!success) {
			setErrorState(
				Object.fromEntries(
					error.issues.map(({ path, message }) => [path[0], message]),
				),
			)
			return
		}

		setErrorState({})
		mutate(data)
	}

	const handleInputChange = (field: string, value: string) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
		setErrorState((prev) => ({ ...prev, [field]: '' }))
	}

	const errorText = (field: keyof ErrorState) =>
		errorState[field] ? (
			<Text
				style={{ color: theme.fault, fontSize: theme.fontSmall, marginTop: 4 }}
			>
				{errorState[field]}
			</Text>
		) : null

	return (
		<ScrollView
			contentContainerStyle={{
				flexGrow: 1,
				justifyContent: 'center',
				paddingTop: 12,
				paddingHorizontal: 26,
				paddingBottom: 80,
			}}
			keyboardShouldPersistTaps="handled"
		>
			<View style={{ width: '100%', alignItems: 'center', marginBottom: 32 }}>
				<View
					style={{
						backgroundColor: theme.accentBlueLight,
						borderRadius: 18,
						width: 68,
						height: 68,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 14,
					}}
				>
					<FontAwesome6 name="droplet" size={30} color={theme.accentBlue} />
				</View>
				<Text
					style={{
						fontSize: theme.fontLarge,
						fontWeight: '600',
						textAlign: 'center',
						color: theme.textPrimary,
						letterSpacing: -0.5,
					}}
				>
					Create your account
				</Text>
			</View>

			<View style={{ width: '100%', gap: 26 }}>
				<View>
					<HydroInput
						label="Full name"
						value={inputState.fullName}
						autoCorrect={false}
						onChangeText={(value) => handleInputChange('fullName', value)}
						labelBackground={theme.modalBackground}
					/>
					{errorText('fullName')}
				</View>
				<View>
					<HydroInput
						label="Username"
						value={inputState.username}
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={(value) => handleInputChange('username', value)}
						labelBackground={theme.modalBackground}
					/>
					{errorText('username')}
				</View>
				<View>
					<HydroInput
						label="Email"
						value={inputState.email}
						keyboardType="email-address"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={(value) => handleInputChange('email', value)}
						labelBackground={theme.modalBackground}
					/>
					{errorText('email')}
				</View>
				<View>
					<HydroInput
						label="Password"
						value={inputState.password}
						autoCapitalize="none"
						autoCorrect={false}
						secureTextEntry
						onChangeText={(value) => handleInputChange('password', value)}
						labelBackground={theme.modalBackground}
					/>
					{errorText('password')}
				</View>
			</View>

			<View style={{ marginTop: 32 }}>
				<HydroButton
					label="Create account"
					modifier={['full']}
					loading={isPending}
					onPress={register}
					iconPosition="right"
					icon={
						<MaterialIcons
							name="arrow-forward"
							size={24}
							color={theme.buttonPrimaryText}
						/>
					}
				/>
			</View>
		</ScrollView>
	)
}
