import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

import SettingScreen, {
	SettingSection,
} from '@/components/settings/SettingScreen'
import StatusScreen from '@/components/status/StatusScreen'
import { useNetwork } from '@/context/NetworkContext'
import { useTheme } from '@/context/ThemeContext'
import { profileQueryFn } from '@/queries/profile'
import { queryCacheStorageKey } from '@/queries/queryClient'
import { useAuth } from '@/stores/authStore'
import { useOnboarding } from '@/stores/onboardingStore'

export default function SettingTabScreen() {
	const queryClient = useQueryClient()
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const router = useRouter()
	const theme = useTheme()
	const [isRefreshing, setIsRefreshing] = useState(false)
	const { isNetworkConnected, isInternetReachable } = useNetwork()
	const isOffline = !isNetworkConnected || !isInternetReachable

	const logout = async () => {
		useAuth.getState().removeAccessToken()
		await SecureStore.deleteItemAsync('refreshToken')
		// Wipe the query cache (and its AsyncStorage copy) so the next
		// session/user can't see stale devices, profile data, etc. from
		// this one.
		queryClient.clear()
		await AsyncStorage.removeItem(queryCacheStorageKey)
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
				<ActivityIndicator size="large" color={theme.colors.accent} />
				<Text style={{ color: theme.colors.textSecondary }}>
					Loading profile...
				</Text>
			</View>
		)
	}

	// Only block the whole screen if we have no profile at all (first load, no cache)
	if (!profile) {
		if (isOffline) {
			return (
				<StatusScreen
					variant="network-error"
					title="No internet connection"
					subtitle="Check your connection and try again."
					onRefresh={onRefresh}
					isRefreshing={isRefreshing}
				/>
			)
		}
		return (
			<StatusScreen
				variant="network-error"
				title="Settings Unavailable"
				subtitle="We couldn't reach the server. Try again shortly."
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	const sections: SettingSection[] = [
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
				{
					label: 'Help centre',
					icon: 'help-outline',
					onPress: () => {},
					requiresServer: true,
				},
				{
					label: 'Contact support',
					icon: 'mail-outline',
					onPress: () => {},
					requiresServer: true,
				},
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
		<SettingScreen
			profile={profile}
			sections={sections}
			isRefreshing={isRefreshing}
			onRefresh={onRefresh}
			isOffline={isOffline}
			hasServerError={!!error}
		/>
	)
}
