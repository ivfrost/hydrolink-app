import { View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function OnboardTextWrapper({
	children,
}: {
	children: React.ReactNode
}) {
	const theme = useTheme()
	return (
		<View
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				gap: theme.space.md,
			}}
		>
			{children}
		</View>
	)
}
