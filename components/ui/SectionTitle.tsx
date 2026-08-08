import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function SectionTitle({ text }: { text: string }) {
	const theme = useTheme()

	return (
		<Text
			style={{
				fontSize: theme.font.sm,
				fontWeight: '600',
				color: theme.colors.textSecondary,
				marginBottom: theme.space.lg,
				marginLeft: theme.space.x2s,
			}}
		>
			{text}
		</Text>
	)
}
