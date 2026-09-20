import { StyleProp, Text, TextStyle } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface TitleProps {
	text: string
	extraStyles?: StyleProp<TextStyle>
}

export default function Title({ text, extraStyles }: TitleProps) {
	const theme = useTheme()
	return (
		<Text
			style={[
				{
					fontSize: theme.font.lg,
					fontWeight: theme.fontWeight.medium,
					letterSpacing: -0.25,
					paddingHorizontal: theme.space.base,
					color: theme.colors.textPrimary,
					textAlign: 'center',
				},
				extraStyles,
			]}
		>
			{text}
		</Text>
	)
}
