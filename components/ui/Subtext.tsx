import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function Subtext({ text }: { text: string }) {
	const theme = useTheme()

	return (
		<Text
			style={{
				fontSize: theme.font.xs,
				fontWeight: theme.fontWeight.regular,
				color: theme.colors.textMuted,
				marginTop: theme.space.sm,
				marginLeft: theme.space.x2s,
			}}
		>
			{text}
		</Text>
	)
}
