import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, TextInput, TextInputProps, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export interface InputProps extends TextInputProps {
	label: string
	labelBackground?: string
}

export default function Input({
	label,
	labelBackground,
	...props
}: InputProps) {
	const theme = useTheme()
	const [focused, setFocused] = useState(false)

	const labelAnim = useRef(new Animated.Value(props.value ? 1 : 0)).current

	const animate = useCallback(
		(toValue: number) => {
			Animated.timing(labelAnim, {
				toValue,
				duration: 150,
				useNativeDriver: false,
			}).start()
		},
		[labelAnim],
	)

	// Keep the floating label in sync with the value even when the field
	// isn't focused (e.g. when the value is cleared programmatically).
	useEffect(() => {
		if (!focused) {
			animate(props.value ? 1 : 0)
		}
	}, [props.value, focused, animate])

	const handleFocus = (e: any) => {
		setFocused(true)
		animate(1)
		props.onFocus?.(e)
	}

	const handleBlur = (e: any) => {
		setFocused(false)
		if (!props.value) animate(0)
		props.onBlur?.(e)
	}

	const labelTop = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [14, -10],
	})

	const labelSize = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [16, 12],
	})

	const labelColor = focused ? theme.colors.accent : theme.colors.textMuted

	// Only render the hint/placeholder once the label has floated up, so the
	// two never overlap while the label sits inside the field.
	const showPlaceholder = focused || !!props.value

	return (
		<View style={{ width: '100%' }}>
			<View
				style={{
					borderWidth: 1.5,
					borderColor: focused ? theme.colors.accent : theme.colors.border,
					borderRadius: theme.radius.input,
					padding: 14,
				}}
			>
				<Animated.Text
					style={{
						position: 'absolute',
						left: 14,
						top: labelTop,
						fontSize: labelSize,
						color: labelColor,
						backgroundColor: labelBackground ?? theme.colors.card,
						paddingHorizontal: 4,
					}}
				>
					{label}
				</Animated.Text>

				<TextInput
					onFocus={handleFocus}
					onBlur={handleBlur}
					style={{
						fontSize: theme.font.base,
						color: theme.colors.textPrimary,
						padding: 0,
					}}
					{...props}
					placeholder={showPlaceholder ? props.placeholder : undefined}
				/>
			</View>
		</View>
	)
}
