import { ActivityIndicator, Text, View } from 'react-native'

import { signOut } from '@aws-amplify/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'

import SettingScreen, {
	SettingSection,
} from '@/components/settings/SettingScreen'
import StatusScreen from '@/components/status/StatusScreen'
import { useNetwork } from '@/context/NetworkContext'
import { useTheme } from '@/context/ThemeContext'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { t } from '@/i18n'
import { profileQueryFn } from '@/queries/profile'
import { queryCacheStorageKey } from '@/queries/queryClient'
import { useOnboarding } from '@/stores/onboardingStore'

export default function SettingTabScreen() {
	const queryClient = useQueryClient()
	const setHasOnboarded = useOnboarding().setHasOnboarded
	const router = useRouter()
	const theme = useTheme()
	const { isRefreshing, refresh } = usePullToRefresh()
	const { isNetworkConnected, isInternetReachable } = useNetwork()
	const isOffline = !isNetworkConnected || !isInternetReachable

	const logout = async () => {
		try {
			await signOut()
		} catch (e) {
			console.warn('[apiFetch] Amplify signOut failed:', e)
		}

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

	const onRefresh = () =>
		refresh(async () => {
			await queryClient.invalidateQueries({ queryKey: ['profile'] })
		}).catch((error) => {
			console.error('Error refreshing profile:', error)
		})

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
					gap: theme.space.md,
				}}
			>
				<ActivityIndicator size="large" color={theme.colors.accent} />
				<Text style={{ color: theme.colors.textSecondary }}>
					{t('common.loadingProfile')}
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
					title={t('settings.noInternet')}
					subtitle={t('settings.checkConnection')}
					onRefresh={onRefresh}
					isRefreshing={isRefreshing}
				/>
			)
		}
		return (
			<StatusScreen
				variant="network-error"
				title={t('settings.settingsUnavailable')}
				subtitle={t('settings.serverUnavailable')}
				onRefresh={onRefresh}
				isRefreshing={isRefreshing}
			/>
		)
	}

	const sections: SettingSection[] = [
		{
			title: t('settings.preferences'),
			rows: [
				{
					label: t('settings.notifications'),
					icon: 'notifications-none',
					onPress: () => {},
				},
			],
		},
		{
			title: t('settings.support'),
			rows: [
				{
					label: t('settings.helpCentre'),
					icon: 'help-outline',
					onPress: () => {},
					requiresServer: true,
				},
				{
					label: t('settings.contactSupport'),
					icon: 'mail-outline',
					onPress: () => {},
					requiresServer: true,
				},
			],
		},
		{
			title: t('settings.session'),
			rows: [{ label: t('settings.logout'), icon: 'logout', onPress: logout }],
		},
		{
			title: t('settings.development'),
			rows: [
				{
					label: t('settings.resetOnboarding'),
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
