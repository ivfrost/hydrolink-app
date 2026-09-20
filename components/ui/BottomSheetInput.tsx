import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'

import { BottomSheetTextInput } from '@gorhom/bottom-sheet'

import { InputProps } from '@/components/ui/Input'
import { useTheme } from '@/context/ThemeContext'

export default function BottomSheetInput({
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
				duration: theme.duration.fast,
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
		<View
			style={{
				width: '100%',
				borderWidth: 1.5,
				borderColor: focused ? theme.colors.accent : theme.colors.outline,
				borderRadius: theme.radius.input,
				paddingHorizontal: theme.space.lg,
				paddingTop: theme.space.xl,
				paddingBottom: theme.space.base,
			}}
		>
			<Animated.Text
				style={{
					position: 'absolute',
					left: theme.space.lg,
					top: labelTop,
					fontSize: labelSize,
					color: labelColor,
					backgroundColor: labelBackground ?? theme.colors.surface,
					paddingHorizontal: theme.space.x2s,
				}}
			>
				{label}
			</Animated.Text>
			<BottomSheetTextInput
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
	)
}
