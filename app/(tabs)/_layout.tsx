import { Animated, StyleSheet, View } from 'react-native'

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Tabs, useRouter } from 'expo-router'

import DropdownMenu from '@/components/ui/DropdownMenu'
import { useTheme } from '@/context/ThemeContext'
import { AreaMenuOptionValue, getAreasScreenHeaderOptions } from '@/data/area'
import { useLocalDiscovery } from '@/hooks/useLocalDiscovery'
import { useAuth } from '@/stores/authStore'
import { decodeJwt } from '@/utils/decodeJwt'

export const tabScrollValues: Record<string, Animated.Value> = {}
export default function TabsLayout() {
	useLocalDiscovery()
	const theme = useTheme()
	const router = useRouter()
	const accessToken = useAuth((state) => state.accessToken)
	const isAdmin = Boolean(
		accessToken && (decodeJwt(accessToken)?.roles ?? []).includes('ADMIN'),
	)

	return (
		<Tabs
			screenOptions={{
				sceneStyle: {
					backgroundColor: theme.colors.background,
				},
				headerTintColor: theme.colors.textPrimary,
				headerBackground: () => (
					<Animated.View
						style={[
							StyleSheet.absoluteFill,
							{
								backgroundColor: theme.colors.background,
							},
						]}
					/>
				),
				tabBarStyle: {
					backgroundColor: theme.colors.modal,
					borderTopColor: theme.colors.border,
					paddingTop: theme.space.sm,
					paddingHorizontal: theme.space.xs,
					height: 90,
				},
				tabBarActiveTintColor: theme.colors.accent,
				tabBarInactiveTintColor: theme.colors.textMuted,
				tabBarLabelStyle: {
					fontSize: theme.font.xs,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Dashboard',
					tabBarIcon: ({ color, focused }) => (
						<View style={{ transform: [{ scale: focused ? 1.15 : 1.0 }] }}>
							<MaterialCommunityIcons
								name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
								size={theme.space.iconSize}
								color={color}
							/>
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="schedules"
				options={{
					title: 'Schedules',
					tabBarIcon: ({ color, focused }) => (
						<View style={{ transform: [{ scale: focused ? 1.15 : 1.0 }] }}>
							<MaterialCommunityIcons
								name={focused ? 'calendar-blank' : 'calendar-blank-outline'}
								size={theme.space.iconSize}
								color={color}
							/>
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="areas"
				options={{
					title: 'Areas',
					headerShown: true,
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
					headerRightContainerStyle: {
						paddingRight: theme.space.sm,
					},
					headerRight: isAdmin
						? () => (
								<DropdownMenu
									options={getAreasScreenHeaderOptions()}
									onClick={(option) => {
										if (option === AreaMenuOptionValue.OTAUpdate) {
											router.push('/(area)/areas/OTA-update')
										}
									}}
									iconColor={theme.colors.textPrimary}
								/>
							)
						: undefined,
					tabBarIcon: ({ color, focused }) => (
						<View style={{ transform: [{ scale: focused ? 1.15 : 1.0 }] }}>
							<MaterialCommunityIcons
								name={
									focused ? 'map-marker-radius' : 'map-marker-radius-outline'
								}
								size={theme.space.iconSize}
								color={color}
							/>
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, focused }) => (
						<View style={{ transform: [{ scale: focused ? 1.15 : 1.0 }] }}>
							<MaterialCommunityIcons
								name={focused ? 'cog' : 'cog-outline'}
								size={theme.space.iconSize}
								color={color}
							/>
						</View>
					),
				}}
			/>
		</Tabs>
	)
}
