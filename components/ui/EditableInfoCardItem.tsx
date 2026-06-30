import { useTheme } from '@/context/ThemeContext'
import { useRef } from 'react'
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native'

interface EditableInfoCardItemProps extends TextInputProps {
	label: string
	text: string
	icon: React.ReactNode
}

export default function EditableInfoCardItem({
	label,
	text,
	icon,
	...props
}: EditableInfoCardItemProps) {
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
				{props.editable ? (
					<TextInput
						ref={inputRef}
						value={text}
						style={[styles.text, styles.input]}
						placeholderTextColor={theme.colors.textMuted}
						{...props}
					/>
				) : (
					<Text style={styles.text}>{text}</Text>
				)}
			</View>
		</View>
	)
}
