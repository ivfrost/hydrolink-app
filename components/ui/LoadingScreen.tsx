import { ActivityIndicator, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export interface LoadingScreenProps {
	label?: string
}

export default function LoadingScreen({
	label = 'Loading...',
}: LoadingScreenProps) {
	const theme = useTheme()
	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				gap: theme.space.md,
			}}
		>
			<ActivityIndicator size="large" color={theme.colors.accentBlue} />
			<Text
				style={{
					color: theme.colors.textSecondary,
					fontSize: theme.font.base,
				}}
			>
				{label}
			</Text>
		</View>
	)
}
