import { useOnboarding } from '@/stores/onboardingStore'
import { useRouter } from 'expo-router'
import {
	View,
	Text,
	ActivityIndicator,
	StyleSheet,
	Pressable,
	Animated,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { profileQuery } from '@/queries/profile'
import { UserCard } from '@/components/UserCard'
import { useTheme } from '@/theme'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useHeaderHeight } from '@react-navigation/elements'
import { useScrollY } from '@/context/ScrollContext'

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
	const scrollY = useScrollY()

	const resetOnboarding = () => {
		setHasOnboarded(false)
		router.replace('/onboarding/onboarding1')
	}
	const headerHeight = useHeaderHeight()

	const { data: profile, isPending, error } = useQuery(profileQuery)

	const styles = StyleSheet.create({
		scrollContent: {
			paddingHorizontal: 14,
			paddingTop: headerHeight + 6,
			paddingBottom: 60,
			gap: 28,
		},
		sectionTitle: {
			fontSize: theme.fontSmall,
			fontWeight: '500',
			color: theme.textPrimary,
			marginBottom: 10,
			marginLeft: 4,
		},
		card: {
			backgroundColor: theme.card,
			borderRadius: theme.cardBorderRadius,
			overflow: 'hidden',
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 14,
			paddingVertical: 16,
			paddingHorizontal: 16,
		},
		rowDivider: {
			height: 1,
			backgroundColor: theme.border,
		},
		iconWrapper: {
			width: 32,
			height: 32,
			borderRadius: 10,
			backgroundColor: theme.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
		},
		rowLabel: {
			flex: 1,
			fontSize: theme.fontBase,
			color: theme.textPrimary,
		},
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
				<ActivityIndicator size="large" color={theme.illustrationPrimary} />
				<Text style={{ color: theme.textSecondary }}>Loading profile...</Text>
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
				<Text style={{ color: theme.textSecondary, textAlign: 'center' }}>
					Couldn&nbps;t load your profile. Pull to retry or check your
					connection.
				</Text>
			</View>
		)
	}

	if (!profile) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<Text style={{ color: theme.textSecondary }}>
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
				[{ nativeEvent: { contentOffset: { y: scrollY } } }],
				{ useNativeDriver: true },
			)}
			scrollEventThrottle={16}
			contentContainerStyle={styles.scrollContent}
		>
			<UserCard
				name={profile.details.fullName}
				email={profile.details.email}
				onPress={() => router.push('/settings/profile')}
			/>

			{sections.map((section) => (
				<View key={section.title}>
					<Text style={styles.sectionTitle}>{section.title}</Text>
					<View style={styles.card}>
						{section.rows.map((row, index) => (
							<View key={row.label}>
								<Pressable style={styles.row} onPress={row.onPress}>
									<View style={styles.iconWrapper}>
										<MaterialIcons
											name={row.icon}
											size={18}
											color={theme.accentBlue}
										/>
									</View>
									<Text style={styles.rowLabel}>{row.label}</Text>
									<MaterialIcons
										name="chevron-right"
										size={20}
										color={theme.textMuted}
									/>
								</Pressable>
								{index < section.rows.length - 1 && (
									<View style={styles.rowDivider} />
								)}
							</View>
						))}
					</View>
				</View>
			))}
			{sections.map((section) => (
				<View key={section.title}>
					<Text style={styles.sectionTitle}>{section.title}</Text>
					<View style={styles.card}>
						{section.rows.map((row, index) => (
							<View key={row.label}>
								<Pressable style={styles.row} onPress={row.onPress}>
									<View style={styles.iconWrapper}>
										<MaterialIcons
											name={row.icon}
											size={18}
											color={theme.accentBlue}
										/>
									</View>
									<Text style={styles.rowLabel}>{row.label}</Text>
									<MaterialIcons
										name="chevron-right"
										size={20}
										color={theme.textMuted}
									/>
								</Pressable>
								{index < section.rows.length - 1 && (
									<View style={styles.rowDivider} />
								)}
							</View>
						))}
					</View>
				</View>
			))}
		</Animated.ScrollView>
	)
}
