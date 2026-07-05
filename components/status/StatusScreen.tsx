import { useTheme } from '@/context/ThemeContext'
import { RefreshControl, ScrollView, View, Text } from 'react-native'
import Button from '@/components/ui/Button'
import Title from '../ui/Title'
import Subtitle from '../ui/Subtitle'

export interface StatusScreenProps {
	image: React.ReactNode
	title: string
	subtitle?: string
	hint?: string
	customContent?: React.ReactNode
	onButtonPress?: () => void
	onRefresh: () => void
	isRefreshing: boolean
	buttonIcon?: React.ReactNode
	buttonLabel?: string
}

export default function StatusScreen({
	image,
	title,
	subtitle,
	hint,
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
				gap: theme.space.xl,
			}}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			}
		>
			{image}

			<View
				style={{
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
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
