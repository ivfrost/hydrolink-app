import React, { useRef } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface EditableInfoCardItemProps extends TextInputProps {
	label: string
	text: string
	error?: string
	icon: React.ReactNode
	renderBottom?: () => React.ReactNode
}

export default function EditableInfoCardItem({
	label,
	text,
	error,
	icon,
	renderBottom,
	...props
}: EditableInfoCardItemProps) {
	const theme = useTheme()
	const inputRef = useRef<TextInput>(null)

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
		iconWrapper: {
			width: theme.space.x3l,
			height: theme.space.x3l,
			borderRadius: theme.radius.fab,
			backgroundColor: theme.colors.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
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
				<View style={styles.iconWrapper}>{icon}</View>
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
									style={{ color: theme.colors.fault, fontSize: theme.font.xs }}
								>
									{error}
								</Text>
							)}
						</>
					) : (
						<Text style={styles.text}>{text}</Text>
					)}
				</View>
			</View>

			{/* Full-width Bottom Container */}
			{renderBottom && (
				<View style={styles.bottomContainer}>{renderBottom()}</View>
			)}
		</View>
	)
}
