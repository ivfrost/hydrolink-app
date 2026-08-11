import { Children, Fragment } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

export interface CardProps {
	flexDirection?: 'column' | 'row'
	children: React.ReactNode
	elevation?: number
	dividerDisabled?: boolean
	overflow?: 'visible' | 'hidden'
	extraStyles?: StyleProp<ViewStyle>
}

export default function Card({
	flexDirection = 'column',
	children,
	elevation = 0,
	dividerDisabled = false,
	overflow = 'visible',
	extraStyles,
}: CardProps) {
	const theme = useTheme()
	const items = Children.toArray(children)

	return (
		<View
			style={[
				{
					flexDirection: flexDirection,
					backgroundColor: theme.colors.card,
					borderRadius: theme.radius.card,
					paddingHorizontal: theme.space.lg,
					elevation: elevation,
					overflow: overflow,
				},
				extraStyles,
			]}
		>
			{items.map((child, index) => (
				<Fragment key={index}>
					<View
						style={{
							flex: 1,
						}}
					>
						{child}
					</View>
					{!dividerDisabled && index < items.length - 1 && (
						<View
							style={{
								width: flexDirection === 'row' ? 1 : '100%',
								height: flexDirection === 'row' ? '100%' : 1,
								marginVertical: 'auto',
								backgroundColor: theme.colors.border,
							}}
						/>
					)}
				</Fragment>
			))}
		</View>
	)
}
