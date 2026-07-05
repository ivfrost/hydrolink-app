import { useTheme } from '@/context/ThemeContext'
import { Text } from 'react-native'

export default function Title({ text }: { text: string }) {
	const theme = useTheme()
	return (
		<Text
			style={{
				fontSize: theme.font.lg,
				fontWeight: '500',
				paddingHorizontal: theme.space.md,
				color: theme.colors.textPrimary,
				textAlign: 'center',
			}}
		>
			{text}
		</Text>
	)
}
