import { Animated, StyleSheet, View } from 'react-native'

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useQuery } from '@tanstack/react-query'
import { Tabs, useRouter } from 'expo-router'

import DropdownMenu from '@/components/ui/DropdownMenu'
import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'
import { AreaMenuOptionValue, getAreasScreenHeaderOptions } from '@/data/area'
import { useLocalDiscovery } from '@/hooks/useLocalDiscovery'
import { profileQueryFn } from '@/queries/profile'

export const tabScrollValues: Record<string, Animated.Value> = {}
export default function TabsLayout() {
	useLocalDiscovery()
	const theme = useTheme()
	const router = useRouter()
	// Roles live in the API (the Cognito tokens don't carry them), so read them
	// from the profile query.
	const { data: profile } = useQuery({
		queryKey: ['profile'],
		queryFn: profileQueryFn,
	})
	const isAdmin = Boolean(profile?.roles.includes('ADMIN'))

	return (
		<Tabs
			screenOptions={{
				sceneStyle: {
					backgroundColor: theme.colors.surface,
				},
				headerTintColor: theme.colors.textPrimary,
				headerBackground: () => (
					<Animated.View
						style={[
							StyleSheet.absoluteFill,
							{
								backgroundColor: theme.colors.surface,
							},
						]}
					/>
				),
				tabBarStyle: {
					backgroundColor: theme.colors.surfaceOverlay,
					borderTopColor: theme.colors.outline,
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
					title: t('tabs.dashboard'),
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
					title: t('tabs.schedules'),
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
					title: t('tabs.areas'),
					headerShown: true,
					headerShadowVisible: false,
					headerStyle: {
						backgroundColor: theme.colors.surface,
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
					title: t('tabs.settings'),
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
