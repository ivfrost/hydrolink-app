import React from 'react'
import {
	ScrollView as RNScrollView,
	ScrollViewProps as RNScrollViewProps,
	RefreshControlProps,
	StyleProp,
	View,
	ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useHeaderHeight } from 'expo-router/build/react-navigation'

import { useTheme } from '@/context/ThemeContext'

export interface ScrollViewProps extends RNScrollViewProps {
	refreshControl?: React.ReactElement<RefreshControlProps>
	extraStyles?: StyleProp<ViewStyle>
	headerTransparent?: boolean
	children: React.ReactNode
	flexDirection?: 'column' | 'row'
	fab?: React.ReactNode
}

export default function ScrollView({
	refreshControl,
	extraStyles,
	headerTransparent = false,
	children,
	fab,
	flexDirection = 'column',
	...props
}: ScrollViewProps) {
	const theme = useTheme()
	const headerHeight = useHeaderHeight()
	const insets = useSafeAreaInsets()
	return (
		<View style={{ flex: 1 }}>
			<RNScrollView
				{...props}
				refreshControl={refreshControl}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={[
					{
						gap: theme.space.xl,
						marginHorizontal: theme.space.lg,
						paddingBottom:
							theme.space.xl +
							Math.max(theme.space.stickyBarHeight, insets.bottom),
						paddingTop: headerTransparent ? headerHeight + theme.space.x3l : 0,
						flexGrow: 1,
						flexDirection,
					},
					extraStyles,
				]}
			>
				{children}
			</RNScrollView>
			{fab && (
				<View style={{ position: 'absolute', bottom: 24, right: 20 }}>
					{fab}
				</View>
			)}
		</View>
	)
}
