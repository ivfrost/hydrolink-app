import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack } from 'expo-router'

import Badge from '@/components/ui/Badge'
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
								// Refresh MQTT so the rebooting device shows as
								// offline until it reconnects, then return to the
								// areas list.
								mqtt.reconnect()
								if (router.canGoBack()) {
									router.back()
								} else {
									router.dismissTo({ pathname: '/(tabs)/areas' })
								}
							},
						},
					],
				)
			case 'logs':
				router.push(`/areas/${areaKey}/logs`)
				break
			default:
				break
		}
	}

	return (
		<Stack
			screenOptions={{
				headerTintColor: theme.colors.textPrimary,
			}}
		>
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
				name="areas/OTA-update"
				options={{
					headerShown: true,
					headerShadowVisible: false,
					animation: 'slide_from_right',
					headerTitle: 'OTA Update',
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
			<Stack.Screen
				name="areas/[key]/logs"
				options={({ route }) => ({
					headerShown: true,
					headerTitle: '',
					headerLeft: () => {
						const { key } = route.params as { key: string }

						return (
							<View
								style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
							>
								<TouchableOpacity
									hitSlop={40}
									onPress={() => {
										if (router.canGoBack()) {
											router.back()
										} else {
											router.dismissTo({ pathname: '/(tabs)/areas' })
										}
									}}
								>
									<MaterialCommunityIcons
										name="arrow-left"
										size={theme.space.iconSize}
										color={theme.colors.textPrimary}
									/>
								</TouchableOpacity>
								<Text
									style={{
										fontSize: theme.font.md,
										color: theme.colors.textPrimary,
									}}
								>
									Logs for {key}
								</Text>
							</View>
						)
					},
					headerShadowVisible: false,
					contentStyle: { backgroundColor: theme.colors.background },
					headerStyle: { backgroundColor: theme.colors.background },
					headerRight: () => {
						const { key } = route.params as { key: string }

						return (
							<Badge
								text={isOnline(key) ? 'Online' : 'Offline'}
								icon="circle"
								iconSize={8}
								color={
									isOnline(key) ? theme.colors.online : theme.colors.offline
								}
								backgroundColor={
									isOnline(key) ? theme.colors.onlineBg : theme.colors.offlineBg
								}
							/>
						)
					},
				})}
			/>
		</Stack>
	)
}
