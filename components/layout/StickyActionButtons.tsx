import { View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import Button from '../ui/Button'

interface StickyActionButtonsProps {
	disabled: boolean
	onSave: () => void
	onDiscard: () => void
	isLoading?: boolean
	bottomInset?: number
}

export function StickyActionButtons({
	disabled,
	onSave,
	onDiscard,
	isLoading = false,
	bottomInset = 0,
}: StickyActionButtonsProps) {
	const theme = useTheme()
	const discardColor = !disabled
		? theme.colors.buttonSecondaryText
		: theme.colors.textMuted
	const saveColor = !disabled
		? theme.colors.buttonPrimaryText
		: theme.colors.textMuted

	return (
		<View
			style={{
				flexDirection: 'row',
				gap: theme.space.md,
				paddingHorizontal: theme.space.lg,
				backgroundColor: theme.colors.modal,
				paddingTop: theme.space.sm,
				paddingBottom: bottomInset + theme.space.sm,
				borderTopWidth: 1,
				borderTopColor: theme.colors.border,
				shadowColor: theme.colors.textPrimary,
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.1,
				shadowRadius: 8,
				height: theme.space.stickyBarHeight,
				elevation: 6,
			}}
		>
			<Button
				variant="secondary"
				onPress={onDiscard}
				icon={
					<MaterialCommunityIcons
						name="undo-variant"
						size={24}
						color={discardColor}
					/>
				}
				extraStyles={{
					flex: 1,
					height: 54,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: !disabled
						? theme.colors.buttonSecondaryBg
						: theme.colors.buttonDisabledBg,
					opacity: !disabled ? 1 : 0.4,
				}}
				disabled={disabled || isLoading}
				label="Discard"
			/>
			<Button
				label="Save"
				variant="primary"
				onPress={onSave}
				icon={
					<MaterialCommunityIcons
						name="content-save-outline"
						size={24}
						color={saveColor}
					/>
				}
				extraStyles={{
					flex: 1,
					height: 54,
					backgroundColor: !disabled
						? theme.colors.buttonPrimaryBg
						: theme.colors.buttonDisabledBg,
					opacity: !disabled ? 1 : 0.4,
				}}
				disabled={disabled}
				loading={isLoading}
			/>
		</View>
	)
}
