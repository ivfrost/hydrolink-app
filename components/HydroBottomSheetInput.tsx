import { View } from 'react-native'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { useTheme } from '@/theme'
import { useState } from 'react'

export default function HydroBottomSheetInput({
	placeholder,
	value,
	onChangeText,
	onSubmitEditing,
}: {
	placeholder: string
	value: string
	onChangeText: (text: string) => void
	onSubmitEditing: () => void
}) {
	const theme = useTheme()
	const [focused, setFocused] = useState<boolean>(false)

	return (
		<BottomSheetTextInput
			placeholder={placeholder}
			placeholderTextColor={theme.textSecondary}
			value={value}
			onChangeText={onChangeText}
			onSubmitEditing={onSubmitEditing}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			style={{
				color: theme.textPrimary,
				fontSize: theme.fontBase,
				fontWeight: '400',
				borderWidth: 2,
				borderColor: focused ? theme.borderActive : theme.border,
				borderRadius: theme.inputBorderRadius,
				paddingHorizontal: 16,
				paddingVertical: 12,
				width: '100%',
			}}
		/>
	)
}
