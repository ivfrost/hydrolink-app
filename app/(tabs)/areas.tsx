import { useRef, useState } from 'react'
import { View, Pressable, StyleSheet, Text } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import BottomSheet from '@gorhom/bottom-sheet'
import HydroBottomSheet from '@/components/HydroBottomSheet'
import HydroButton from '@/components/HydroButton'
import HydroBottomSheetInput from '@/components/HydroBottomSheetInput'
import HydroSubmitButton from '@/components/HydroSubmitButton'
import { useTheme } from '@/theme'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { areaLinkMutation } from '@/mutations/areas'
import * as Burnt from 'burnt'

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
			width: 58,
			height: 58,
			borderRadius: theme.themeFabRadius,
			backgroundColor: theme.buttonPrimaryBg,
			justifyContent: 'center',
			alignItems: 'center',
			shadowColor: theme.illustrationPrimary,
			shadowOpacity: 0.3,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 6 },
			elevation: 6,
		},
	})

	return (
		<View style={{ flex: 1 }}>
			{/* ...your existing devices list/content... */}

			<Pressable
				style={({ pressed }) => [
					styles.fab,
					{ transform: [{ scale: pressed ? 0.94 : 1 }] },
				]}
				onPress={() => bottomSheetRef.current?.expand()}
			>
				<MaterialIcons name="add" size={28} color={theme.buttonPrimaryText} />
			</Pressable>

			<HydroBottomSheet ref={bottomSheetRef} snapPoints={[400]}>
				<HydroButton
					label="Scan QR Code"
					modifier={['tall', 'full']}
					icon={
						<MaterialIcons
							name="qr-code-scanner"
							size={24}
							color={theme.buttonPrimaryText}
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
					<View style={{ backgroundColor: theme.border, height: 2, flex: 1 }} />
					<Text style={{ color: theme.textSecondary }}>or enter manually</Text>
					<View style={{ backgroundColor: theme.border, height: 2, flex: 1 }} />
				</View>
				<View style={{ gap: 20 }}>
					<HydroBottomSheetInput
						label="Enter Link Code"
						value={linkCode}
						onChangeText={setLinkCode}
						onSubmitEditing={handleLinkCodeSubmit}
						labelBackground={theme.card}
					/>
					<HydroSubmitButton
						modifier={['tall', 'full']}
						disabled={linkCode.length !== 32 || linkPending}
						variant="secondary"
						onPress={handleLinkCodeSubmit}
					/>
				</View>
			</HydroBottomSheet>
		</View>
	)
}
