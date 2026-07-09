import { useRef, useState } from 'react'
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

	const animate = (toValue: number) => {
		Animated.timing(labelAnim, {
			toValue,
			duration: 150,
			useNativeDriver: false,
		}).start()
	}

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
	const labelColor = focused ? theme.colors.accentBlue : theme.colors.textMuted

	return (
		<View
			style={{
				width: '100%',
				borderWidth: 1.5,
				borderColor: focused ? theme.colors.accentBlue : theme.colors.border,
				borderRadius: theme.radius.input,
				paddingHorizontal: 14,
				paddingTop: 18,
				paddingBottom: 10,
			}}
		>
			<Animated.Text
				style={{
					position: 'absolute',
					left: 14,
					top: labelTop,
					fontSize: labelSize,
					color: labelColor,
					backgroundColor: labelBackground ?? theme.colors.background,
					paddingHorizontal: 4,
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
			/>
		</View>
	)
}
