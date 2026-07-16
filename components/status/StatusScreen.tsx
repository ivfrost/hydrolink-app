import { RefreshControl, ScrollView, Text, View } from 'react-native'

import FilesMissingIllustration from '@/assets/images/status/undraw_files-missing_ntwe.svg'
import ServerFailureIllustration from '@/assets/images/status/undraw_server-failure_syqp.svg'
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
				gap: theme.space.x2l,
			}}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			}
		>
			{variant === 'network-error' ? (
				<ServerFailureIllustration width={200} height={220} />
			) : (
				<FilesMissingIllustration width={200} height={220} />
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
