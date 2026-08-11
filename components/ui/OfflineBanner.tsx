import { StyleSheet, Text, View } from 'react-native'

import { MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

interface OfflineBannerProps {
	message: string
}

export default function OfflineBanner({ message }: OfflineBannerProps) {
	const theme = useTheme()

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.colors.warningBg,
					borderColor: theme.colors.warningBorder,
					borderRadius: theme.radius.badge,
					paddingVertical: theme.space.sm,
					paddingHorizontal: theme.space.md,
					marginBottom: theme.space.md,
					gap: theme.space.xs,
				},
			]}
		>
			<MaterialIcons
				name="wifi-off"
				size={theme.space.iconSizeSm}
				color={theme.colors.warning}
			/>
			<Text
				style={[
					styles.text,
					{ color: theme.colors.warning, fontSize: theme.font.xs },
				]}
			>
				{message}
			</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
	},
	text: {
		fontWeight: '500',
	},
})
