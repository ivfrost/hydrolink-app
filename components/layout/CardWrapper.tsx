import { useTheme } from '@/context/ThemeContext'
import { Children, Fragment } from 'react'
import { View, StyleSheet } from 'react-native'

export interface CardWrapperProps {
	children: React.ReactNode
}

export default function CardWrapper({ children }: CardWrapperProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.card,
			borderRadius: theme.radius.card,
			overflow: 'hidden',
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
	})

	const items = Children.toArray(children)

	return (
		<View style={styles.card}>
			{items.map((child, index) => (
				<Fragment key={index}>
					{child}
					{index < items.length - 1 && <View style={styles.divider} />}
				</Fragment>
			))}
		</View>
	)
}
