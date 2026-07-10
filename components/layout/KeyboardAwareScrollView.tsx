import { StyleProp, View, ViewStyle } from 'react-native'
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller'

import { useTheme } from '@/context/ThemeContext'

export interface KeyboardAwareScrollViewProps extends React.ComponentProps<
	typeof RNKeyboardAwareScrollView
> {
	children: React.ReactNode
	extraStyles?: StyleProp<ViewStyle>
}

export default function KeyboardAwareScrollView({
	children,
	extraStyles,
	...props
}: KeyboardAwareScrollViewProps) {
	const theme = useTheme()
	return (
		<View style={{ flex: 1 }}>
			<RNKeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={[
					{
						flexGrow: 1,
						paddingHorizontal: theme.space.xl,
						paddingBottom: theme.space.x3l,
						gap: theme.space.x3l,
						justifyContent: 'center',
					},
					extraStyles,
				]}
				{...props}
			>
				{children}
			</RNKeyboardAwareScrollView>
		</View>
	)
}
