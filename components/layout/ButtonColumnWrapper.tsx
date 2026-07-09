import { View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export default function ButtonColumnWrapper({
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
				gap: theme.space.xl,
			}}
		>
			{children}
		</View>
	)
}
