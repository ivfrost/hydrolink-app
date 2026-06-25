import { Tabs } from 'expo-router'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { StyleSheet } from 'react-native'
import { useTheme } from '@/theme'

export default function Layout() {
	const theme = useTheme()
	return (
		<Tabs
			screenOptions={{
				tabBarStyle: {
					backgroundColor: theme.card,
					borderTopColor: theme.border,
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
				name="devices"
				options={{
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons name="antenna" size={size} color={color} />
					),
					title: 'Devices',
					tabBarLabel: 'Devices',
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
