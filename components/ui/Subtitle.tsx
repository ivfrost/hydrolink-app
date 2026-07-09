import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function Subtitle({
	text,
	children,
}: {
	text?: string
	children?: React.ReactNode
}) {
	const theme = useTheme()
	return (
		<Text
			style={{
				fontSize: theme.font.base,
				color: theme.colors.textSecondary,
				textAlign: 'center',
				paddingHorizontal: theme.space.md,
				lineHeight: theme.lineHeight.paragraph,
			}}
		>
			{children ?? text}
		</Text>
	)
}
