import { Animated, StyleSheet, View } from 'react-native'

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useQuery } from '@tanstack/react-query'
import { Tabs } from 'expo-router'

import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { areasQueryFn } from '@/queries/areas'
import { profileQueryFn } from '@/queries/profile'

export const tabScrollValues: Record<string, Animated.Value> = {}

export default function TabsLayout() {
	useQuery({ queryKey: tanstackKeys.PROFILE, queryFn: profileQueryFn })
	useQuery({ queryKey: tanstackKeys.AREAS, queryFn: areasQueryFn })

	const theme = useTheme()

	return (
		<Tabs
			screenOptions={{
				headerTransparent: true,
				sceneStyle: {
					backgroundColor: theme.colors.background,
				},
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
				tabBarActiveTintColor: theme.colors.accentBlue,
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
								size={22}
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
								size={22}
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
					tabBarIcon: ({ color, focused }) => (
						<View style={{ transform: [{ scale: focused ? 1.15 : 1.0 }] }}>
							<MaterialCommunityIcons
								name={
									focused ? 'map-marker-radius' : 'map-marker-radius-outline'
								}
								size={22}
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
								size={22}
								color={color}
							/>
						</View>
					),
				}}
			/>
		</Tabs>
	)
}
