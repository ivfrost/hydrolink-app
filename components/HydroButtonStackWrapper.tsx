import { useTheme } from '@/context/ThemeContext'
import { View } from 'react-native'

export default function HydroButtonStackWrapper({
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
