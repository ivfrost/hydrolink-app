import { useTheme } from '@/context/ThemeContext'
import { Text } from 'react-native'

export default function HydroSubtitle({
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
				lineHeight: theme.lineHeight.paragraph,
			}}
		>
			{children ?? text}
		</Text>
	)
}
