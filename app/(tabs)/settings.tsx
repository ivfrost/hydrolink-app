import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import {
	View,
	Text,
	ActivityIndicator,
	RefreshControl,
	ScrollView,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { UserCard } from '@/components/profile/UserCard'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useHeaderHeight } from '@react-navigation/elements'
import { useTheme } from '@/context/ThemeContext'
import CardWrapper from '@/components/layout/CardWrapper'
import React, { useState } from 'react'
import SimpleRowCardItem from '@/components/ui/SimpleRowCard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SectionTitle from '@/components/ui/SectionTitle'
import { useAuth } from '@/stores/authStore'
import * as SecureStore from 'expo-secure-store'

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
	const queryClient = useQueryClient()
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const router = useRouter()
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const logout = async () => {
		useAuth.getState().removeAccessToken()
		await SecureStore.deleteItemAsync('refreshToken')
	}

	const resetOnboarding = async () => {
		logout()
		setHasOnboarded(false)
		router.replace('/onboarding/onboarding1')
	}

	const onRefresh = async () => {
		setIsRefreshing(true)
		try {
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
		} catch (error) {
			console.error('Error refreshing profile:', error)
		} finally {
			setIsRefreshing(false)
		}
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
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />

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
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
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
				{
					label: 'Log out',
					icon: 'logout',
					onPress: async () => {
						await logout().then(() => router.replace('/onboarding/onboarding2'))
					},
				},
			],
		},
	]

	return (
		<ScrollView
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight + theme.space.sm,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
			}}
		>
			<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			<UserCard
				name={profile.fullName}
				email={profile.email}
				onPress={() => router.push('/settings/profile')}
			/>

			{sections.map((section) => (
				<View key={section.title}>
					<SectionTitle text={section.title} />
					<CardWrapper elevation={0} paddingDisabled={true}>
						{section.rows.map((row) => (
							<SimpleRowCardItem
								key={row.label}
								label={row.label}
								icon={row.icon}
								onPress={row.onPress}
							/>
						))}
					</CardWrapper>
				</View>
			))}
		</ScrollView>
	)
}
