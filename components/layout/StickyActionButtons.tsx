import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/context/ThemeContext'
import Button from '../ui/Button'

interface StickyActionButtonsProps {
	hasChanges: boolean
	onSave: () => void
	onDiscard: () => void
	isLoading?: boolean
	bottomInset?: number
}

export function StickyActionButtons({
	hasChanges,
	onSave,
	onDiscard,
	isLoading = false,
	bottomInset = 0,
}: StickyActionButtonsProps) {
	const theme = useTheme()
	const discardColor = hasChanges
		? theme.colors.buttonSecondaryText
		: theme.colors.textMuted
	const saveColor = hasChanges
		? theme.colors.buttonPrimaryText
		: theme.colors.textMuted
	const STICKY_BAR_HEIGHT = theme.space.x2l * 3

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
				shadowColor: '#000',
				shadowOffset: { width: 0, height: -2 },
				shadowOpacity: 0.1,
				shadowRadius: 8,
				height: STICKY_BAR_HEIGHT,
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
					backgroundColor: hasChanges
						? theme.colors.buttonSecondaryBg
						: theme.colors.modal,
					opacity: hasChanges ? 1 : 0.4,
				}}
				disabled={!hasChanges || isLoading}
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
					backgroundColor: hasChanges
						? theme.colors.buttonPrimaryBg
						: theme.colors.modal,
					opacity: hasChanges ? 1 : 0.4,
				}}
				disabled={!hasChanges || isLoading}
				loading={isLoading}
			/>
		</View>
	)
}
