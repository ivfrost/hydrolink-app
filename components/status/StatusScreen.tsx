import { RefreshControl, ScrollView, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import Button from '@/components/ui/Button'
import { useTheme } from '@/context/ThemeContext'

import Subtitle from '../ui/Subtitle'
import Title from '../ui/Title'

export interface StatusScreenProps {
	title: string
	subtitle?: string
	hint?: string
	variant?: 'network-error' | 'missing-data'
	customContent?: React.ReactNode
	onButtonPress?: () => void
	onRefresh: () => void
	isRefreshing: boolean
	buttonIcon?: React.ReactNode
	buttonLabel?: string
}

export default function StatusScreen({
	title,
	subtitle,
	hint,
	variant = 'network-error',
	customContent,
	onButtonPress,
	onRefresh,
	isRefreshing,
	buttonIcon,
	buttonLabel,
}: StatusScreenProps) {
	const theme = useTheme()

	return (
		<ScrollView
			contentContainerStyle={{
				flex: 1,
				paddingHorizontal: theme.space.x3l,
				paddingBottom: theme.space.x3l,
				justifyContent: 'center',
				alignItems: 'center',
				gap: theme.space.lg,
			}}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} progressBackgroundColor={theme.colors.background} />
			}
		>
			{variant === 'network-error' ? (
				<MaterialCommunityIcons
					name="server-off"
					size={theme.space.iconSizeXl}
					color={theme.colors.textMuted}
				/>
			) : (
				variant === 'missing-data' && (
					<MaterialCommunityIcons
						name="database-off"
						size={theme.space.iconSizeXl}
						color={theme.colors.textMuted}
					/>
				)
			)}
			<View
				style={{
					alignItems: 'center',
					gap: theme.space.x2l,
				}}
			>
				<View style={{ alignItems: 'center', gap: theme.space.md }}>
					<Title text={title} />
					{subtitle && <Subtitle text={subtitle} />}

					{!customContent && hint && (
						<Text
							style={{
								color: theme.colors.textMuted,
								textAlign: 'center',
								marginBottom: theme.space.md,
								fontWeight: '400',
							}}
						>
							{hint}
						</Text>
					)}
					{!hint && !subtitle && customContent}
				</View>

				{buttonLabel && onButtonPress && (
					<Button
						icon={buttonIcon}
						label={buttonLabel}
						onPress={onButtonPress}
					/>
				)}
			</View>
		</ScrollView>
	)
}
