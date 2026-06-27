import HydroButton from '@/components/HydroButton'
import HydroInput from '@/components/HydroInput'
import { useTheme } from '@/theme'
import { useState } from 'react'
import { Platform, View, Text, StyleSheet } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

export default function SignIn() {
	const [inputState, setInputState] = useState({
		email: '',
		password: '',
	})
	const theme = useTheme()
	const API_URL =
		Platform.OS === 'android'
			? 'http://192.168.1.124:3000'
			: 'http://localhost:3000'

	const login = () => {}
	const handleInputChange = (field: string, value: string) => {
		setInputState((prevState) => ({
			...prevState,
			[field]: value,
		}))
	}

	const styles = StyleSheet.create({
		inputGroup: {
			justifyContent: 'center',
			alignItems: 'center',
			gap: 20,
			width: '100%',
		},
		inputLabel: {
			fontSize: theme.fontSmall,
			fontWeight: '500',
			color: theme.textSecondary,
			marginBottom: 8,
		},
	})
	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				paddingTop: 12,
				paddingHorizontal: 26,
				paddingBottom: 80,
			}}
		>
			<View style={styles.inputGroup}>
				{/* Logo + heading */}
				<View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
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
						Welcome back
					</Text>
					<Text
						style={{
							fontSize: theme.fontSmall,
							textAlign: 'center',
							fontWeight: '400',
							color: theme.textSecondary,
							marginTop: 6,
						}}
					>
						Sign in to continue
					</Text>
				</View>

				{/* Inputs */}
				<View style={{ width: '100%', gap: 14 }}>
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
					</View>
					<View>
						<HydroInput
							label="Password"
							value={inputState.email}
							autoCapitalize="none"
							autoCorrect={false}
							onChangeText={(value) => handleInputChange('password', value)}
							labelBackground={theme.modalBackground}
							secureTextEntry
						/>
					</View>
				</View>

				<HydroButton label="Sign In" modifier={['full']} onPress={login} />
			</View>
		</View>
	)
}
