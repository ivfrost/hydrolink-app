import HydroButton from '@/components/HydroButton'
import HydroInput from '@/components/HydroInput'
import { useTheme } from '@/theme'
import { useState } from 'react'
import { Platform, View, Text, StyleSheet, ScrollView } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

export default function Register() {
	const [inputState, setInputState] = useState({
		email: '',
		username: '',
		fullName: '',
		password: '',
		preferredLanguage: 'en',
	})
	const theme = useTheme()

	const register = () => {}
	const handleInputChange = (field: string, value: string) => {
		setInputState((prev) => ({ ...prev, [field]: value }))
	}

	const styles = StyleSheet.create({
		inputGroup: {
			width: '100%',
			gap: 14,
		},
	})

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
			{/* Logo + heading */}
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
				<Text
					style={{
						fontSize: theme.fontSmall,
						textAlign: 'center',
						fontWeight: '400',
						color: theme.textSecondary,
						marginTop: 6,
					}}
				>
					It only takes a moment
				</Text>
			</View>

			{/* Inputs */}
			<View style={styles.inputGroup}>
				<HydroInput
					label="Full name"
					value={inputState.fullName}
					autoCorrect={false}
					onChangeText={(value) => handleInputChange('fullName', value)}
					labelBackground={theme.modalBackground}
				/>
				<HydroInput
					label="Username"
					value={inputState.username}
					autoCapitalize="none"
					autoCorrect={false}
					onChangeText={(value) => handleInputChange('username', value)}
					labelBackground={theme.modalBackground}
				/>
				<HydroInput
					label="Email"
					value={inputState.email}
					keyboardType="email-address"
					autoCapitalize="none"
					autoCorrect={false}
					onChangeText={(value) => handleInputChange('email', value)}
					labelBackground={theme.modalBackground}
				/>
				<HydroInput
					label="Password"
					value={inputState.password}
					autoCapitalize="none"
					autoCorrect={false}
					secureTextEntry
					onChangeText={(value) => handleInputChange('password', value)}
					labelBackground={theme.modalBackground}
				/>
			</View>

			<View style={{ marginTop: 24 }}>
				<HydroButton
					label="Create account"
					modifier={['full']}
					onPress={register}
				/>
			</View>
		</ScrollView>
	)
}
