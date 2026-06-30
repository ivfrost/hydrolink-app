import { Tabs, usePathname } from 'expo-router'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Animated, StyleSheet } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { areasQuery } from '@/queries/areas'
import { MaterialIcons } from '@expo/vector-icons'
import FadeHeaderBackground from '@/components/FadeHeaderBackground'
import { useEffect, useState } from 'react'

export const tabScrollValues: Record<string, Animated.Value> = {}

export default function TabsLayout() {
	useQuery(profileQuery)
	useQuery(areasQuery)

	const pathname = usePathname()
	const theme = useTheme()

	// Ensure an animated value exists for the current tab path
	if (!tabScrollValues[pathname]) {
		tabScrollValues[pathname] = new Animated.Value(0)
	}

	const [headerOpacity, setHeaderOpacity] = useState(0)

	useEffect(() => {
		const listenerId = tabScrollValues[pathname].addListener(({ value }) => {
			setHeaderOpacity(Math.min(value / 60, 1)) // clamp 0 → 1
		})

		return () => {
			tabScrollValues[pathname].removeListener(listenerId)
		}
	}, [pathname])

	return (
		<Tabs
			screenOptions={{
				headerTransparent: true,
				sceneStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBackground: () => (
					<FadeHeaderBackground opacity={headerOpacity} theme={theme} />
				),
				tabBarStyle: {
					backgroundColor: theme.colors.modal,
					borderTopColor: theme.colors.border,
					paddingTop: 8,
					paddingBottom: 12,
					height: 90,
				},
				tabBarActiveTintColor: theme.colors.accentBlue,
				tabBarInactiveTintColor: theme.colors.textMuted,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name="view-dashboard-outline"
							size={size}
							color={color}
						/>
					),
					title: 'Dashboard',
					tabBarLabel: 'Dashboard',
					tabBarLabelStyle: styles.label,
				}}
			/>
			<Tabs.Screen
				name="schedules"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name="calendar-blank-outline"
							size={size}
							color={color}
						/>
					),
					title: 'Schedules',
					tabBarLabel: 'Schedules',
					tabBarLabelStyle: styles.label,
				}}
			/>
			<Tabs.Screen
				name="areas"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialIcons name="sensors" size={size} color={color} />
					),
					title: 'Areas',
					tabBarLabel: 'Areas',
					tabBarLabelStyle: styles.label,
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							name="cog-outline"
							size={size}
							color={color}
						/>
					),
					title: 'Settings',
					tabBarLabel: 'Settings',
					tabBarLabelStyle: styles.label,
				}}
			/>
		</Tabs>
	)
}

const styles = StyleSheet.create({
	label: {
		fontSize: 12,
		fontWeight: 'semibold',
	},
})
