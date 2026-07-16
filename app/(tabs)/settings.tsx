import { useState } from 'react'
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useHeaderHeight } from 'expo-router/build/react-navigation'
import * as SecureStore from 'expo-secure-store'

import Card from '@/components/layout/Card'
import { UserCard } from '@/components/profile/UserCard'
import Button from '@/components/ui/Button'
import SectionTitle from '@/components/ui/SectionTitle'
import SimpleCardItem from '@/components/ui/SimpleRowCard'
import { useTheme } from '@/context/ThemeContext'
import { profileQueryFn } from '@/queries/profile'
import { useAuth } from '@/stores/authStore'
import { useOnboarding } from '@/stores/onboardingStore'

interface SettingsRow {
	label: string
	icon: keyof typeof MaterialIcons.glyphMap
	onPress?: () => void
}

interface SettingsSection {
	title: string
	rows: SettingsRow[]
}

export default function SettingTabScreen() {
	const queryClient = useQueryClient()
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const router = useRouter()
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const [isRefreshing, setIsRefreshing] = useState(false)

	const logout = async () => {
		useAuth.getState().removeAccessToken()
		await SecureStore.deleteItemAsync('refreshToken')
		router.replace('/onboarding/onboarding2')
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

	const {
		data: profile,
		isPending,
		error,
	} = useQuery({
		queryKey: ['profile'],
		queryFn: profileQueryFn,
	})

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
				<Button onPress={logout} label={'Logout'} />
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
			title: 'Session',
			rows: [{ label: 'Logout', icon: 'logout', onPress: logout }],
		},
		{
			title: 'Development',
			rows: [
				{
					label: 'Reset onboarding',
					icon: 'restart-alt',
					onPress: resetOnboarding,
				},
			],
		},
	]

	return (
		<ScrollView
			contentContainerStyle={{
				paddingHorizontal: theme.space.lg,
				paddingTop: headerHeight,
				paddingBottom: insets.bottom + theme.space.lg,
				gap: theme.space.x2l,
			}}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					progressViewOffset={headerHeight}
					onRefresh={onRefresh}
				/>
			}
		>
			<UserCard
				name={profile.fullName}
				email={profile.email}
				avatarSize={62}
				onPress={() => router.push('/settings/profile')}
			/>

			{sections.map((section) => (
				<View key={section.title}>
					<SectionTitle text={section.title} />
					<Card elevation={0}>
						{section.rows.map((row) => {
							if (row.label === 'Logout') {
								return (
									<SimpleCardItem
										key={row.label}
										label={row.label}
										icon={row.icon}
										onPress={row.onPress}
										modifiers={['fault']}
									/>
								)
							}

							return (
								<SimpleCardItem
									key={row.label}
									label={row.label}
									icon={row.icon}
									onPress={row.onPress}
								/>
							)
						})}
					</Card>
				</View>
			))}
		</ScrollView>
	)
}
