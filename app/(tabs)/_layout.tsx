import { Tabs } from 'expo-router'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Animated, StyleSheet } from 'react-native'
import { useTheme } from '@/theme'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { areasQuery } from '@/queries/areas'
import { MaterialIcons } from '@expo/vector-icons'
import { useScrollY } from '@/context/ScrollContext'

export default function TabsLayout() {
	useQuery(profileQuery)
	useQuery(areasQuery)
	const scrollY = useScrollY()
	const headerOpacity = scrollY.interpolate({
		inputRange: [0, 60],
		outputRange: [0, 1],
		extrapolate: 'clamp',
	})
	const theme = useTheme()

	return (
		<Tabs
			screenOptions={{
				headerTransparent: true,
				headerBackground: () => (
					<Animated.View
						style={[
							StyleSheet.absoluteFill,
							{
								backgroundColor: theme.headerBackground,
								opacity: headerOpacity,
							},
						]}
					/>
				),
				tabBarStyle: {
					backgroundColor: theme.card,
					borderTopColor: theme.border,
					paddingTop: 8,
					paddingBottom: 12,
					height: 90,
				},
				tabBarActiveTintColor: theme.accent,
				tabBarInactiveTintColor: theme.textMuted,
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
