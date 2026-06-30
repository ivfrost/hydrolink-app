import { View, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useTheme } from '@/context/ThemeContext'
import HydroButton from './HydroButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface StickyActionButtonsProps {
	hasChanges: boolean
	onSave: () => void
	onDiscard: () => void
	isLoading?: boolean
}

export function StickyActionButtons({
	hasChanges,
	onSave,
	onDiscard,
	isLoading = false,
}: StickyActionButtonsProps) {
	const theme = useTheme()
	const insets = useSafeAreaInsets()
	const discardColor = hasChanges
		? theme.colors.buttonSecondaryText
		: theme.colors.textMuted
	const saveColor = hasChanges
		? theme.colors.buttonPrimaryText
		: theme.colors.textMuted

	const styles = StyleSheet.create({
		buttonGroup: {
			flexDirection: 'row',
			gap: 10,
			paddingTop: 10,
			paddingBottom: insets.bottom + 1,
			paddingHorizontal: 14,
			backgroundColor: theme.colors.modal,
			borderTopWidth: 1,
			borderTopColor: theme.colors.border,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: -2 },
			shadowOpacity: 0.1,
			shadowRadius: 8,
			elevation: 8,
		},
	})

	return (
		<View style={styles.buttonGroup}>
			<HydroButton
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
			<HydroButton
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
