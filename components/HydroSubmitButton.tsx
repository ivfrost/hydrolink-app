import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import HydroButton, { HydroButtonProps } from './HydroButton'
import { useTheme } from '@/context/ThemeContext'

export default function HydroSubmitButton({
	label,
	variant = 'primary',
	modifier,
	onPress,
}: Partial<HydroButtonProps>) {
	const theme = useTheme()
	return (
		<HydroButton
			label={label ?? 'Submit'}
			variant={variant ?? 'primary'}
			modifier={modifier}
			iconPosition="right"
			icon={
				<MaterialIcons
					name="arrow-forward"
					size={24}
					color={
						variant === 'primary'
							? theme.colors.buttonPrimaryText
							: theme.buttonSecondaryText
					}
				/>
			}
			onPress={onPress}
		/>
	)
}
