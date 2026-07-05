import { Tabs } from 'expo-router'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Animated, StyleSheet, View } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { areasQuery } from '@/queries/areas'

export const tabScrollValues: Record<string, Animated.Value> = {}

export default function TabsLayout() {
	useQuery(profileQuery)
	useQuery(areasQuery)

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
