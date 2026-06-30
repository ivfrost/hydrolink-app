import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/context/ThemeContext'

interface CredentialChangeHeaderProps {
	title: string
	description: string
	currentValue?: string
	currentLabel?: string
}

export function CredentialChangeHeader({
	title,
	description,
	currentValue,
	currentLabel = 'Current',
}: CredentialChangeHeaderProps) {
	const theme = useTheme()

	return (
		<View style={{ gap: theme.space.md }}>
			<Text
				style={{
					fontSize: theme.font.lg,
					fontWeight: '600',
					color: theme.colors.textPrimary,
				}}
			>
				{title}
			</Text>
			<Text
				style={{
					fontSize: theme.font.sm,
					color: theme.colors.textSecondary,
					lineHeight: theme.lineHeight.paragraph,
				}}
			>
				{description}
				{currentValue && (
					<View>
						<Text
							style={{
								fontSize: theme.font.sm,
								color: theme.colors.textMuted,
								marginTop: theme.space.sm,
							}}
						>
							{currentLabel}: {currentValue}
						</Text>
					</View>
				)}
			</Text>
		</View>
	)
}
