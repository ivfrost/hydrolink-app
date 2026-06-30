import { useOnboarding } from '@/stores/onboardingStore'
import { usePathname, useRouter } from 'expo-router'
import { View, Text, ActivityIndicator, Animated } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { UserCard } from '@/components/UserCard'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useHeaderHeight } from '@react-navigation/elements'
import { tabScrollValues } from './_layout'
import { useTheme } from '@/context/ThemeContext'
import HydroCardWrapper from '@/components/HydroCardWrapper'
import React from 'react'
import SettingRow from '@/components/SettingRow'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import HydroSectionTitle from '@/components/HydroSectionTitle'

interface SettingsRow {
	label: string
	icon: keyof typeof MaterialIcons.glyphMap
	onPress?: () => void
}

interface SettingsSection {
	title: string
	rows: SettingsRow[]
}

export default function SettingsScreen() {
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const router = useRouter()
	const theme = useTheme()
	const pathname = usePathname()
	const currentScrollY = tabScrollValues[pathname] || new Animated.Value(0)
	const insets = useSafeAreaInsets()

	const resetOnboarding = () => {
		setHasOnboarded(false)
		router.replace('/onboarding/onboarding1')
	}
	const headerHeight = useHeaderHeight()

	const { data: profile, isPending, error } = useQuery(profileQuery)

	if (isPending) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accentBlue} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading profile...
				</Text>
			</View>
		)
	}

	if (error) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					paddingHorizontal: 20,
				}}
			>
				<Text
					style={{ color: theme.colors.textSecondary, textAlign: 'center' }}
				>
					Couldn't load your profile. Pull to retry or check your connection.
				</Text>
			</View>
		)
	}

	if (!profile) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={{ color: theme.colors.textSecondary }}>
					No profile data found.
				</Text>
			</View>
		)
	}

	const sections: SettingsSection[] = [
		{
			title: 'Preferences',
			rows: [
				{ label: 'Units', icon: 'straighten', onPress: () => {} },
				{
					label: 'Notifications',
					icon: 'notifications-none',
					onPress: () => {},
				},
			],
		},
		{
			title: 'Support',
			rows: [
				{ label: 'Help centre', icon: 'help-outline', onPress: () => {} },
				{ label: 'Contact support', icon: 'mail-outline', onPress: () => {} },
			],
		},
		{
			title: 'Account',
			rows: [
				{
					label: 'Reset onboarding',
					icon: 'restart-alt',
					onPress: resetOnboarding,
				},
				{ label: 'Log out', icon: 'logout', onPress: () => {} },
			],
		},
	]

	return (
		<Animated.ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: currentScrollY } } }],
				{ useNativeDriver: true },
			)}
			scrollEventThrottle={16}
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight + theme.space.sm,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
			}}
		>
			<UserCard
				name={profile.details.fullName}
				email={profile.details.email}
				onPress={() => router.push('/settings/profile')}
			/>

			{sections.map((section) => (
				<View key={section.title}>
					<HydroSectionTitle text={section.title} />
					<HydroCardWrapper>
						{section.rows.map((row) => (
							<SettingRow
								key={row.label}
								label={row.label}
								icon={row.icon}
								onPress={row.onPress}
							/>
						))}
					</HydroCardWrapper>
				</View>
			))}
		</Animated.ScrollView>
	)
}
