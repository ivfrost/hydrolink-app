import { useTheme } from '@/context/ThemeContext'
import { Text } from 'react-native'

export default function SectionTitle({ text }: { text: string }) {
	const theme = useTheme()

	return (
		<Text
			style={{
				fontSize: theme.font.sm,
				fontWeight: '500',
				color: theme.colors.textPrimary,
				marginBottom: 10,
				marginLeft: 4,
			}}
		>
			{text}
		</Text>
	)
}
