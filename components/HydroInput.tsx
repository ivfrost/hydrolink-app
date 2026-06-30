import { useTheme } from '@/context/ThemeContext'
import { useRef, useState } from 'react'
import { Animated, TextInput, TextInputProps, View } from 'react-native'

export interface HydroInputProps extends TextInputProps {
	label: string
	labelBackground?: string
}

export default function HydroInput({
	label,
	value,
	labelBackground,
	onFocus,
	onBlur,
	onSubmitEditing,
	...props
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

	const handleFocus = (e: any) => {
		setFocused(true)
		animate(1)
		onFocus?.(e)
	}

	const handleBlur = (e: any) => {
		setFocused(false)
		if (!value) animate(0)
		onBlur?.(e)
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
		<View style={{ width: '100%' }}>
			<View
				style={{
					borderWidth: 1.5,
					borderColor: focused ? theme.colors.accentBlue : theme.colors.border,
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
						backgroundColor: labelBackground ?? theme.colors.background,
						paddingHorizontal: 4,
					}}
				>
					{label}
				</Animated.Text>
				<TextInput
					value={value}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onSubmitEditing={onSubmitEditing}
					style={{
						fontSize: theme.font.base,
						color: theme.colors.textPrimary,
						padding: 0,
					}}
					{...props}
				/>
			</View>
		</View>
	)
}
