import { RefreshControl, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { useTheme } from '@/context/ThemeContext'

import Card from '../layout/Card'
import ScrollView from '../layout/ScrollView'
import { UserCard } from '../profile/UserCard'
import OfflineBanner from '../ui/OfflineBanner'
import SectionTitle from '../ui/SectionTitle'
import SimpleCardItem from '../ui/SimpleRowCard'

interface SettingRow {
	label: string
	icon: keyof typeof MaterialIcons.glyphMap
	onPress?: () => void
	requiresServer?: boolean
}

export interface SettingSection {
	title: string
	rows: SettingRow[]
}

export interface SettingScreenProps {
	profile: any
	sections: SettingSection[]
	isRefreshing: boolean
	onRefresh: () => void
	isOffline: boolean
	hasServerError: boolean
}

export default function SettingScreen({
	profile,
	sections,
	isRefreshing,
	onRefresh,
	isOffline,
	hasServerError,
}: SettingScreenProps) {
	const router = useRouter()
	const theme = useTheme()
	const serverUnavailable = isOffline || hasServerError

	return (
		<ScrollView
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					colors={[theme.colors.accent]}
				/>
			}
		>
			{serverUnavailable && (
				<OfflineBanner
					message={
						isOffline ? 'No internet connection' : "Can't reach the server"
					}
				/>
			)}

			<UserCard
				name={profile.fullName}
				email={profile.email}
				imageUrl={profile.imageUrl}
				avatarSize={62}
				onPress={
					!serverUnavailable
						? () => router.push('/settings/profile')
						: undefined
				}
			/>

			{!!sections &&
				sections.map((section) => (
					<View key={section.title}>
						<SectionTitle text={section.title} />
						<Card elevation={0}>
							{section.rows.map((row) => {
								const disabled = row.requiresServer && serverUnavailable
								console.log(row.label, {
									requiresServer: row.requiresServer,
									serverUnavailable,
									disabled,
								})

								return (
									<SimpleCardItem
										key={row.label}
										label={row.label}
										icon={row.icon}
										onPress={() =>
											console.log(row.label, {
												requiresServer: row.requiresServer,
												serverUnavailable,
												disabled,
											})
										}
										disabled={disabled}
										modifiers={row.label === 'Logout' ? ['fault'] : undefined}
									/>
								)
							})}
						</Card>
					</View>
				))}
		</ScrollView>
	)
}
