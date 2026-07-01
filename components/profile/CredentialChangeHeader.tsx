import { View, Text } from 'react-native'
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
		<View style={{ gap: theme.space.md, alignItems: 'center' }}>
			<Text
				style={{
					fontSize: theme.font.lg,
					fontWeight: '600',
					color: theme.colors.textPrimary,
					textAlign: 'center',
				}}
			>
				{title}
			</Text>
			<Text
				style={{
					fontSize: theme.font.sm,
					color: theme.colors.textSecondary,
					lineHeight: theme.lineHeight.paragraph,
					textAlign: 'center',
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
