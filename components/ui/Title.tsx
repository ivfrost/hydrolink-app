import { Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function Title({ text }: { text: string }) {
	const theme = useTheme()
	return (
		<Text
			style={{
				fontSize: theme.font.xl,
				fontWeight: '600',
				letterSpacing: -0.25,
				paddingHorizontal: theme.space.base,
				color: theme.colors.textPrimary,
				textAlign: 'center',
			}}
		>
			{text}
		</Text>
	)
}
