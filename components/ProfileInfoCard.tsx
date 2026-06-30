import { useTheme } from '@/context/ThemeContext'
import { useRef } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'

interface ProfileInfoCardProps {
	label: string
	text: string
	icon: React.ReactNode
	editable?: boolean
	onChangeText?: (value: string) => void
	secureTextEntry?: TextInputProps['secureTextEntry']
	textContentType?: TextInputProps['textContentType']
	autoComplete?: TextInputProps['autoComplete']
	autoCapitalize?: TextInputProps['autoCapitalize']
	keyboardType?: TextInputProps['keyboardType']
}

export default function ProfileInfoCard({
	label,
	text,
	icon,
	editable = false,
	onChangeText,
	secureTextEntry = false,
	textContentType = 'none',
	autoComplete = 'off',
	autoCapitalize = 'none',
	keyboardType = 'default',
}: ProfileInfoCardProps) {
	const theme = useTheme()
	const inputRef = useRef<TextInput>(null)

	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.lg,
			paddingVertical: theme.space.lg,
			paddingHorizontal: theme.space.lg,
		},
		iconWrapper: {
			width: theme.space.x3l,
			height: theme.space.x3l,
			borderRadius: theme.radius.fab,
			backgroundColor: theme.colors.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
		},
		textContainer: {
			flex: 1,
			gap: 2,
		},
		label: {
			fontSize: theme.font.xs,
			marginBottom: 2,
			color: theme.colors.textMuted,
			fontWeight: '400',
		},
		text: {
			fontSize: theme.font.base,
			color: theme.colors.textPrimary,
		},
		input: {
			padding: 0,
			margin: 0,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
			paddingBottom: 4,
		},
	})

	return (
		<View style={styles.row}>
			<View style={styles.iconWrapper}>{icon}</View>
			<View style={styles.textContainer}>
				<Text style={styles.label}>{label}</Text>
				{editable ? (
					<TextInput
						ref={inputRef}
						value={text}
						onChangeText={onChangeText}
						keyboardType={keyboardType}
						style={[styles.text, styles.input]}
						placeholderTextColor={theme.colors.textMuted}
						textContentType={textContentType}
						autoComplete={autoComplete}
						autoCapitalize={autoCapitalize}
						secureTextEntry={secureTextEntry}
					/>
				) : (
					<Text style={styles.text}>{text}</Text>
				)}
			</View>
		</View>
	)
}
