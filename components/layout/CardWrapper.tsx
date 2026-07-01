import { useTheme } from '@/context/ThemeContext'
import { Children, Fragment } from 'react'
import { View, StyleSheet } from 'react-native'

export interface CardWrapperProps {
	flexDirection?: 'column' | 'row'
	children: React.ReactNode
	elevation?: number
	dividerDisabled?: boolean
	paddingDisabled?: boolean
}

export default function CardWrapper({
	flexDirection = 'column',
	children,
	elevation = 0,
	dividerDisabled = false,
	paddingDisabled = false,
}: CardWrapperProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		card: {
			flexDirection,
			backgroundColor: theme.colors.card,
			borderRadius: theme.radius.card,
			overflow: 'hidden',
			elevation: elevation,
		},
		itemContainer: {
			padding: paddingDisabled ? 0 : theme.space.md,
		},
		divider: {
			width: flexDirection === 'row' ? 1 : '100%',
			height: flexDirection === 'row' ? '100%' : 1,
			marginVertical: 'auto',
			backgroundColor: theme.colors.border,
		},
	})

	const items = Children.toArray(children)

	return (
		<View style={styles.card}>
			{items.map((child, index) => (
				<Fragment key={index}>
					<View style={styles.itemContainer}>{child}</View>
					{!dividerDisabled && index < items.length - 1 && (
						<View style={styles.divider} />
					)}
				</Fragment>
			))}
		</View>
	)
}
