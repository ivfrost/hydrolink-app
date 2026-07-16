import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function Subtitle({
	text,
	children,
	textAlign = 'center',
}: {
	text?: string
	textAlign?: 'left' | 'center' | 'right'
	children?: React.ReactNode
}) {
	const theme = useTheme()
	return (
		<Text
			style={{
				fontSize: theme.font.base,
				color: theme.colors.textSecondary,
				textAlign: textAlign,
				paddingHorizontal: theme.space.x2s,
				lineHeight: theme.lineHeight.paragraph,
			}}
		>
			{children ?? text}
		</Text>
	)
}
