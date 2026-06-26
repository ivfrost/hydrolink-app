import { useTheme } from '@/theme'
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetView,
} from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { RefObject, useCallback } from 'react'

interface HydroBottomSheetProps {
	ref: RefObject<BottomSheetMethods | null>
	snapPoints?: number[]
	children?: React.ReactNode
	style?: object
}

export default function HydroBottomSheet({
	ref,
	snapPoints = [200, 500],
	children,
	style,
}: HydroBottomSheetProps) {
	const theme = useTheme()

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
		<BottomSheet
			ref={ref}
			index={-1}
			snapPoints={snapPoints}
			enablePanDownToClose
			enableDynamicSizing={false}
			keyboardBehavior="interactive"
			keyboardBlurBehavior="restore"
			backdropComponent={renderBackdrop}
			backgroundStyle={{ backgroundColor: theme.card }}
		>
			<BottomSheetView
				style={[{ marginHorizontal: 20, marginVertical: 20, gap: 14 }, style]}
			>
				{children}
			</BottomSheetView>
		</BottomSheet>
	)
}
