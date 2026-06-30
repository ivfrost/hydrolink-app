import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/context/ThemeContext'

export default function OnboardContainer({
	children,
}: {
	children: React.ReactNode
}) {
	const theme = useTheme()

	return (
		<LinearGradient
			colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
			style={{ flex: 1 }}
		>
			<SafeAreaView
				style={{
					justifyContent: 'space-evenly',
					alignItems: 'center',
					flex: 1,
					paddingHorizontal: theme.space.x3l,
				}}
			>
				{children}
			</SafeAreaView>
		</LinearGradient>
	)
}
