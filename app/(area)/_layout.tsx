import { Alert, Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { router, Stack } from 'expo-router'

import Badge from '@/components/ui/Badge'
import DropdownMenu from '@/components/ui/DropdownMenu'
import { tanstackKeys } from '@/constants'
import { useMqtt } from '@/context/MqttContext'
import { useTheme } from '@/context/ThemeContext'
import { AreaMenuOptionValue, getAreaMenuOptions } from '@/data/area'
import { areaUnlinkMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { useAreaStore } from '@/stores/areaStore'
import { useHeaderStore } from '@/stores/headerStore'
import { AppError } from '@/types/api'

export default function AreaLayout() {
	const theme = useTheme()
	const mqtt = useMqtt()
	const queryClient = useQueryClient()
	const isOnline = useAreaStore((state) => state.isOnline)
	const removeArea = useAreaStore((state) => state.removeArea)
	const areaHeaderOpacity = useHeaderStore((state) => state.areaHeaderOpacity)
	const { data: areas } = useQuery({
		queryKey: tanstackKeys.AREAS,
		queryFn: areasQueryFn,
	})
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

	const handleTappedOption = (option: AreaMenuOptionValue, areaKey: string) => {
		switch (option) {
			case 'edit':
				if (!areaKey) return
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
								// Return to the areas list. The device reports itself
								// offline via the broker's last-will while it reboots,
								// then comes back online once it reconnects.
								if (router.canGoBack()) {
									router.back()
								} else {
									router.dismissTo({ pathname: '/(tabs)/areas' })
								}
							},
						},
					],
				)
				break
			case 'logs':
				router.push(`/areas/${areaKey}/logs`)
				break
			case 'connectivity':
				router.push(`/areas/${areaKey}/connectivity`)
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
				name="areas/[key]/connectivity"
				options={({ navigation, route }) => {
					const { key } = route.params as { key: string }

					return {
						headerShown: true,
						headerShadowVisible: false,
						animation: 'slide_from_right',
						headerTitle: '',
						headerLeft: () => (
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: theme.space.sm,
								}}
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
										fontWeight: '600',
										flexShrink: 1,
									}}
									numberOfLines={1}
								>
									Connectivity for {key}
								</Text>
							</View>
						),
						contentStyle: {
							backgroundColor: theme.colors.background,
						},
						headerStyle: {
							backgroundColor: 'transparent',
						},
					}
				}}
			/>

			<Stack.Screen
				name="areas/[key]"
				options={({ navigation, route }) => {
					const { key } = route.params as { key: string }
					const area = areas?.find((a) => a.key === key)
					const hasImage = Boolean(area?.imageUrl)
					// No image: header is always opaque. With an image it fades in
					// as you scroll past the hero.
					const opacity = hasImage ? areaHeaderOpacity : 1
					const tintDark = opacity > 0.6
					// The status bar mirrors the header tint: white icons over the
					// hero image, dark icons once the opaque header fades in.
					const statusBarStyle = tintDark
						? theme.mode === 'dark'
							? 'light'
							: 'dark'
						: 'light'

					return {
						headerTitle: '',
						headerShown: true,
						headerTransparent: true,
						headerShadowVisible: false,
						headerTintColor: tintDark ? theme.colors.textPrimary : '#ffffff',
						statusBarStyle,
						headerBackground: () => (
							<View
								style={{
									flex: 1,
									backgroundColor: theme.colors.background,
									opacity,
								}}
							/>
						),
						contentStyle: {
							backgroundColor: theme.colors.background,
						},
						presentation: 'modal',
						headerRight: () => (
							<DropdownMenu
								options={getAreaMenuOptions(isOnline(key))}
								onClick={(optionValue) => handleTappedOption(optionValue, key)}
								iconColor={tintDark ? theme.colors.textPrimary : '#ffffff'}
								pressedColor={
									tintDark
										? theme.colors.buttonTertiaryPressed
										: 'rgba(255,255,255,0.2)'
								}
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
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: theme.space.sm,
								}}
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
										fontWeight: '600',
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
