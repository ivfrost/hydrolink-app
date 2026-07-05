import { View, Text } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
import Title from '../ui/Title'
import Subtitle from '../ui/Subtitle'

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
			<Title text={title} />
			<Subtitle text={description} />
			<Text
				style={{
					fontSize: theme.font.sm,
					color: theme.colors.textSecondary,
					textAlign: 'center',
				}}
			>
				{currentValue && (
					<View>
						<Text
							style={{
								fontSize: theme.font.sm,
								color: theme.colors.textMuted,
								marginTop: theme.space.x3s,
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
