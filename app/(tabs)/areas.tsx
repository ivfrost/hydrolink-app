import { useRef, useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import BottomSheet from '@gorhom/bottom-sheet'
import HydroBSheet from '@/components/layout/BottomSheet'
import Button from '@/components/ui/Button'
import BottomSheetInput from '@/components/ui/BottomSheetInput'
import { useTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { areaLinkMutation } from '@/mutations/areas'
import * as Burnt from 'burnt'
import { Portal } from '@gorhom/portal'

export default function DevicesScreen() {
	const theme = useTheme()
	const router = useRouter()
	const bottomSheetRef = useRef<BottomSheet>(null)
	const [linkCode, setLinkCode] = useState('')

	const { mutate, isPending: linkPending } = useMutation({
		...areaLinkMutation,
		onSuccess: () => {
			bottomSheetRef.current?.close()
			Burnt.toast({ title: 'Area linked successfully', preset: 'done' })
		},
		onError: (error) => {
			Burnt.toast({
				title:
					error.message === 'NETWORK_ERROR'
						? 'Could not connect to server'
						: 'Invalid link code',
				preset: 'error',
			})
		},
	})

	const handleLinkCodeSubmit = () => {
		if (linkCode.length !== 32) {
			Burnt.dismissAllAlerts()
			Burnt.toast({ title: 'The Link Code must be of 32 characters of length' })
			return
		}
		mutate(linkCode)
	}

	const styles = StyleSheet.create({
		fab: {
			position: 'absolute',
			right: 20,
			bottom: 28,
		},
	})

	return (
		<View style={{ flex: 1 }}>
			<Button
				label={''}
				modifier={['fab']}
				icon={
					<MaterialIcons
						name="add"
						size={28}
						color={theme.colors.buttonPrimaryText}
					/>
				}
				extraStyles={styles.fab}
				onPress={() => bottomSheetRef.current?.expand()}
			/>

			<Portal>
				<HydroBSheet ref={bottomSheetRef} snapPoints={[364]}>
					<Button
						label="Scan QR Code"
						modifier={['tall', 'full']}
						icon={
							<MaterialIcons
								name="qr-code-scanner"
								size={24}
								color={theme.colors.buttonPrimaryText}
							/>
						}
						onPress={() => router.push('/(area)/scan')}
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
							onSubmitEditing={handleLinkCodeSubmit}
							labelBackground={theme.colors.card}
						/>
						<Button
							label={'Submit'}
							variant="secondary"
							modifier={['tall', 'full']}
							disabled={linkCode.length !== 32 || linkPending}
							onPress={handleLinkCodeSubmit}
							iconPosition="right"
							icon={
								<MaterialIcons
									name="arrow-forward"
									size={24}
									color={
										linkCode.length !== 32 || linkPending
											? theme.colors.textMuted
											: theme.colors.buttonSecondaryText
									}
								/>
							}
						/>
					</View>
				</HydroBSheet>
			</Portal>
		</View>
	)
}
