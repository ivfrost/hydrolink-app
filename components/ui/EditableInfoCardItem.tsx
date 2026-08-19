import React, { useRef } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import Button from './Button'
import HeadingIcon from './HeadingIcon'

interface EditableInfoCardItemProps extends TextInputProps {
	label: string
	text: string
	error?: string
	icon:
		| keyof typeof MaterialCommunityIcons.glyphMap
		| keyof typeof MaterialIcons.glyphMap
	renderBottom?: () => React.ReactNode
	/** When set, a check button appears inline when the value differs from this. */
	initialValue?: string
	/** Called when the user taps the inline confirm button. */
	onConfirm?: (value: string) => void
	/** Whether a confirm is in flight (shows a spinner on the button). */
	confirmLoading?: boolean
}

export default function EditableInfoCardItem({
	label,
	text,
	error,
	icon,
	renderBottom,
	initialValue,
	onConfirm,
	confirmLoading = false,
	...props
}: EditableInfoCardItemProps) {
	const theme = useTheme()
	const inputRef = useRef<TextInput>(null)

	const hasChanges =
		onConfirm && initialValue !== undefined && text !== initialValue

	const styles = StyleSheet.create({
		cardContainer: {
			width: '100%',
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.lg,
			padding: theme.space.lg,
		},
		inputMetaGroup: {
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
		bottomContainer: {
			width: '100%',
		},
	})

	return (
		<View style={styles.cardContainer}>
			{/* Upper Input Row */}
			<View style={styles.row}>
				<HeadingIcon
					icon={icon}
					statusColor={theme.colors.accent}
					statusBg={theme.colors.accentTint}
				/>
				<View style={styles.inputMetaGroup}>
					<Text style={styles.label}>{label}</Text>
					{props.editable ? (
						<>
							<TextInput
								ref={inputRef}
								value={text}
								style={[styles.text, styles.input]}
								placeholderTextColor={theme.colors.textMuted}
								{...props}
							/>
							{error && (
								<Text
									style={{
										color: theme.colors.fault,
										fontSize: theme.font.xs,
									}}
								>
									{error}
								</Text>
							)}
						</>
					) : (
						<Text style={styles.text}>{text}</Text>
					)}
				</View>

				{/* Inline confirm button */}
				{hasChanges && (
					<Button
						variant="confirm"
						loading={confirmLoading}
						onPress={() => onConfirm?.(text)}
					/>
				)}
			</View>

			{/* Full-width Bottom Container */}
			{renderBottom && (
				<View style={styles.bottomContainer}>{renderBottom()}</View>
			)}
		</View>
	)
}
