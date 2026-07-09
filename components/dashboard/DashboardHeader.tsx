import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import { useTheme } from '@/context/ThemeContext'

function getGreeting() {
	const hour = new Date().getHours()
	if (hour < 12) return 'Good morning'
	if (hour < 19) return 'Good afternoon'
	return 'Good evening'
}

function getGreetingIcon(): keyof typeof MaterialCommunityIcons.glyphMap {
	const hour = new Date().getHours()
	if (hour < 12) return 'weather-sunset-up'
	if (hour < 19) return 'weather-sunny'
	return 'weather-night'
}

export interface DashboardHeaderProps {
	name?: string
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
	const theme = useTheme()
	const badgeSize = theme.space.x3l + 12

	return (
		<LinearGradient
			colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{
				padding: theme.space.xl,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<View style={{ flex: 1, paddingRight: theme.space.md }}>
				<Text
					style={{
						fontSize: theme.font.lg,
						fontWeight: '600',
						color: theme.colors.textPrimary,
					}}
				>
					{getGreeting()}
					{name ? `, ${name}` : ''}
				</Text>
				<Text
					style={{
						fontSize: theme.font.sm,
						color: theme.colors.textSecondary,
						marginTop: 4,
						lineHeight: theme.lineHeight.paragraph,
					}}
				>
					Here's how your areas are doing today
				</Text>
			</View>
			<View
				style={{
					width: badgeSize,
					height: badgeSize,
					borderRadius: badgeSize / 2,
					backgroundColor: theme.colors.card,
					justifyContent: 'center',
					alignItems: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 6,
				}}
			>
				<MaterialCommunityIcons
					name={getGreetingIcon()}
					size={28}
					color={theme.colors.accentBlue}
				/>
			</View>
		</LinearGradient>
	)
}
