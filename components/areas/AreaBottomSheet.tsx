import { RefObject } from 'react'
import { Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types'
import { Portal } from '@gorhom/portal'

import BottomSheet from '@/components/layout/BottomSheet'
import BottomSheetInput from '@/components/ui/BottomSheetInput'

import Button from '../ui/Button'

export interface AreaBottomSheetProps {
	bottomSheetRef: RefObject<BottomSheetMethods | null>
	linkCode: string
	onScanPress: () => void
	setLinkCode: (value: string) => void
	onLinkCodeSubmit: () => void
	linkPending: boolean
	serverUnavailable: boolean
	theme: any
}

export default function AreaBottomSheet({
	bottomSheetRef,
	linkCode,
	onScanPress,
	setLinkCode,
	onLinkCodeSubmit,
	linkPending,
	serverUnavailable,
	theme,
}: AreaBottomSheetProps) {
	return (
		<Portal>
			<BottomSheet ref={bottomSheetRef} snapPoints={[364]}>
				<Button
					label="Scan QR Code"
					modifier={['tall', 'full']}
					icon={
						<MaterialIcons
							name="qr-code-scanner"
							size={theme.space.iconSize}
							color={theme.colors.buttonPrimaryText}
						/>
					}
					onPress={onScanPress}
				/>
				<View
					style={{
						flexDirection: 'row',
						width: '100%',
						alignItems: 'center',
						gap: 20,
						marginVertical: 10,
					}}
				>
					<View
						style={{
							backgroundColor: theme.colors.border,
							height: 2,
							flex: 1,
						}}
					/>
					<Text style={{ color: theme.colors.textSecondary }}>
						or enter manually
					</Text>
					<View
						style={{
							backgroundColor: theme.colors.border,
							height: 2,
							flex: 1,
						}}
					/>
				</View>
				<View style={{ gap: theme.space.md, marginTop: theme.space.x2l }}>
					<BottomSheetInput
						label="Enter Link Code"
						value={linkCode}
						onChangeText={setLinkCode}
						onSubmitEditing={onLinkCodeSubmit}
						labelBackground={theme.colors.card}
					/>
					<Button
						label="Submit"
						variant="secondary"
						modifier={['tall', 'full']}
						disabled={
							serverUnavailable || linkCode.length !== 32 || linkPending
						}
						onPress={onLinkCodeSubmit}
						iconPosition="right"
						icon={
							<MaterialIcons
								name="arrow-forward"
								size={theme.space.iconSize}
								color={
									linkCode.length !== 32 || linkPending
										? theme.colors.textMuted
										: theme.colors.buttonSecondaryText
								}
							/>
						}
					/>
				</View>
			</BottomSheet>
		</Portal>
	)
}
