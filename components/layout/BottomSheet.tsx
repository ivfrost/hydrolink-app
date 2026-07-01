import { useTheme } from '@/context/ThemeContext'
import GorhomBottomSheet, {
	BottomSheetProps as GorhomBottomSheetProps,
	BottomSheetBackdrop,
	BottomSheetView,
	useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { RefObject, useCallback } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

interface BottomSheetProps extends GorhomBottomSheetProps {
	ref: RefObject<BottomSheetMethods | null>
	extraStyles?: StyleProp<ViewStyle>
}

export default function BottomSheet({
	ref,
	snapPoints = [200, 500],
	children,
	extraStyles,
}: BottomSheetProps) {
	const theme = useTheme()

	const animConfigs = useBottomSheetSpringConfigs({
		mass: 1,
		damping: 35,
		stiffness: 250,
		overshootClamping: true,
	})

	const renderBackdrop = useCallback(
		(props: BottomSheetDefaultBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				pressBehavior="close"
			/>
		),
		[],
	)

	return (
		<GorhomBottomSheet
			ref={ref}
			snapPoints={snapPoints}
			enablePanDownToClose
			enableDynamicSizing={false}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			backdropComponent={renderBackdrop}
			backgroundStyle={{ backgroundColor: theme.colors.card }}
			animationConfigs={animConfigs}
			animateOnMount={false}
			index={-1}
		>
			<BottomSheetView
				style={[
					{
						marginHorizontal: theme.space.xl,
						marginVertical: theme.space.xl,
						gap: theme.space.lg,
					},
					extraStyles,
				]}
			>
				{children}
			</BottomSheetView>
		</GorhomBottomSheet>
	)
}
