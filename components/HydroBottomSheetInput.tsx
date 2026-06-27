import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useTheme } from '@/theme'
import { useRef, useState } from 'react'
import { Animated, View } from 'react-native'
import { HydroInputProps } from './HydroInput'

export default function HydroBottomSheetInput({
	label,
	value,
	onChangeText,
	onSubmitEditing,
	labelBackground,
}: HydroInputProps) {
	const theme = useTheme()
	const [focused, setFocused] = useState(false)
	const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current

	const animate = (toValue: number) => {
		Animated.timing(labelAnim, {
			toValue,
			duration: 150,
			useNativeDriver: false,
		}).start()
	}

	const handleFocus = () => {
		setFocused(true)
		animate(1)
	}

	const handleBlur = () => {
		setFocused(false)
		if (!value) animate(0)
	}

	const labelTop = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [14, -10],
	})
	const labelSize = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [16, 12],
	})

	return (
		<View
			style={{
				width: '100%',
				borderWidth: 1.5,
				borderColor: focused ? theme.borderActive : theme.border,
				borderRadius: theme.inputBorderRadius,
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
					color: focused ? theme.borderActive : theme.textMuted,
					backgroundColor: labelBackground ?? theme.background,
					paddingHorizontal: 4,
				}}
			>
				{label}
			</Animated.Text>
			<BottomSheetTextInput
				value={value}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				onFocus={handleFocus}
				onBlur={handleBlur}
				style={{
					fontSize: theme.fontBase,
					color: theme.textPrimary,
					padding: 0,
				}}
			/>
		</View>
	)
}
