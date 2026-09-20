import { StyleProp, Text, TextStyle } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function SectionTitle({
	text,
	style,
}: {
	text: string
	style?: StyleProp<TextStyle>
}) {
	const theme = useTheme()

	return (
		<Text
			style={[
				{
					fontSize: theme.font.sm,
					fontWeight: theme.fontWeight.semibold,
					color: theme.colors.textSecondary,
					marginBottom: theme.space.lg,
					marginLeft: theme.space.x2s,
				},
				style,
			]}
		>
			{text}
		</Text>
	)
}
