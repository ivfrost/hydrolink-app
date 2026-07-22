import { Alert } from 'react-native'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack } from 'expo-router'

import DropdownMenu from '@/components/ui/DropdownMenu'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { AreaMenuOption, getAreaMenuOptions } from '@/data/area'
import { areaUnlinkMutationFn } from '@/mutations/areas'
import { useAreaStore } from '@/stores/areaStore'
import { AppError } from '@/types/api'

export default function AreaLayout() {
	const theme = useTheme()
	const mqtt = useMqtt()
	const queryClient = useQueryClient()
	const isOnline = useAreaStore((state) => state.isOnline)
	const removeArea = useAreaStore((state) => state.removeArea)
	const { mutate: unlinkArea } = useMutation({
		mutationFn: areaUnlinkMutationFn,
		mutationKey: ['unlinkArea'],
		onError: (error: AppError, areaKey) => {
			if (error.code === 'DEVICE_NOT_FOUND') {
				if (router.canGoBack()) {
					router.back()
				}
				removeArea(areaKey)
				queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
			}
			Burnt.toast({
				title:
					error.code === 'UNKNOWN_ERROR'
						? 'An unknown error occurred while unlinking the area.'
						: error.message,
				preset: 'error',
			})
		},
		onSuccess: (_, areaKey) => {
			if (router.canGoBack()) {
				router.back()
			}
			removeArea(areaKey)
			queryClient.invalidateQueries({ queryKey: tanstackKeys.AREAS })
			Burnt.toast({ title: 'Area unlinked successfully.', preset: 'done' })
		},
	})

	const handleTappedOption = (
		option: AreaMenuOption['value'],
		areaKey: string,
	) => {
		switch (option) {
			case 'edit':
				if (!areaKey) return
				console.log('Navigating to edit area screen for areaKey:', areaKey)
				// Navigate to the edit area screen
				router.push(`/areas/edit/${areaKey}`)

				break
			case 'unlink':
				Alert.alert(
					'Unlink Area',
					'Are you sure you want to unlink this area? This will remove it from your account.',
					[
						{
							text: 'Cancel',
							style: 'cancel',
						},
						{
							text: 'Unlink',
							style: 'destructive',
							onPress: () => {
								unlinkArea(areaKey)
							},
						},
					],
				)
				break
			case 'reboot':
				Alert.alert(
					'Reboot Area',
					'Are you sure you want to reboot this area?',
					[
						{
							text: 'Cancel',
							style: 'cancel',
						},
						{
							text: 'Reboot',
							style: 'destructive',
							onPress: () => {
								mqtt.rebootArea(areaKey)
							},
						},
					],
				)
				break
			default:
				break
		}
	}

	return (
		<Stack>
			<Stack.Screen
				name="scan"
				options={{
					headerShown: true,
					headerShadowVisible: false,
					animation: 'slide_from_right',
					headerTitle: 'Scan QR Code',
					contentStyle: {
						backgroundColor: theme.colors.background,
					},
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
				}}
			/>
			<Stack.Screen
				name="areas/edit/[key]"
				options={{
					headerShown: true,
					headerShadowVisible: false,
					animation: 'slide_from_bottom',
					headerTitle: 'Edit Area',
					headerRight: () => null,
					contentStyle: {
						backgroundColor: theme.colors.background,
					},
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
				}}
			/>

			<Stack.Screen
				name="areas/[key]"
				options={({ navigation, route }) => {
					const { key } = route.params as { key: string }

					return {
						headerTitle: '',
						headerShown: true,
						headerShadowVisible: false,
						contentStyle: {
							backgroundColor: theme.colors.background,
						},
						headerStyle: {
							backgroundColor: theme.colors.background,
						},
						presentation: 'modal',
						headerRight: () => (
							<DropdownMenu
								options={getAreaMenuOptions(isOnline(key))}
								onClick={(optionValue) => handleTappedOption(optionValue, key)}
							/>
						),
					}
				}}
			/>
		</Stack>
	)
}
