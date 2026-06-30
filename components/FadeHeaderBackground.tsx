import { Animated, StyleSheet } from 'react-native'

export default function FadeHeaderBackground({ opacity, theme }) {
	return (
		<Animated.View
			style={[
				StyleSheet.absoluteFill,
				{
					backgroundColor: theme.colors.background,
					opacity,
				},
			]}
		/>
	)
}
