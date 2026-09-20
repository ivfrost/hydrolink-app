import { StyleProp, View, ViewStyle } from 'react-native'
import { KeyboardAwareScrollView as RNKeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHeaderHeight } from 'expo-router/build/react-navigation'

import { useTheme } from '@/context/ThemeContext'

export interface KeyboardAwareScrollViewProps extends React.ComponentProps<
	typeof RNKeyboardAwareScrollView
> {
	children: React.ReactNode
	extraStyles?: StyleProp<ViewStyle>
	headerTransparent?: boolean
}

export default function KeyboardAwareScrollView({
	children,
	extraStyles,
	headerTransparent = false,
	...props
}: KeyboardAwareScrollViewProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const headerHeight = useHeaderHeight()
	return (
		<View style={{ flex: 1 }}>
			<RNKeyboardAwareScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={[
					{
						flexGrow: 1,
						marginHorizontal: theme.space.lg,
						paddingBottom:
							theme.space.xl +
							Math.max(theme.space.stickyBarHeight, insets.bottom),
						paddingTop: headerTransparent ? headerHeight + theme.space.x3l : 0,
						gap: theme.space.xl,
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
