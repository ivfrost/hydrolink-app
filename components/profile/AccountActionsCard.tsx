import { useTheme } from '@/context/ThemeContext'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface AccountActionsCardProps {
	onChangeEmail: () => void
	onChangePassword: () => void
}

export function AccountActionsCard({
	onChangeEmail,
	onChangePassword,
}: AccountActionsCardProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.card,
			borderRadius: theme.radius.card,
			overflow: 'hidden',
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 14,
			paddingVertical: 16,
			paddingHorizontal: 16,
		},
		rowDivider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
		iconWrapper: {
			width: 32,
			height: 32,
			borderRadius: 10,
			backgroundColor: theme.colors.accentBlueLight,
			justifyContent: 'center',
			alignItems: 'center',
		},
		rowLabel: {
			flex: 1,
			fontSize: theme.font.base,
			color: theme.colors.textPrimary,
		},
	})

	return (
		<View style={styles.card}>
			<Pressable style={styles.row} onPress={onChangeEmail}>
				<View style={styles.iconWrapper}>
					<MaterialCommunityIcons
						name="email-outline"
						size={18}
						color={theme.colors.accentBlue}
					/>
				</View>
				<Text style={styles.rowLabel}>Change email</Text>
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={theme.colors.textMuted}
				/>
			</Pressable>
			<View style={styles.rowDivider} />
			<Pressable style={styles.row} onPress={onChangePassword}>
				<View style={styles.iconWrapper}>
					<MaterialCommunityIcons
						name="lock-outline"
						size={18}
						color={theme.colors.accentBlue}
					/>
				</View>
				<Text style={styles.rowLabel}>Change password</Text>
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={theme.colors.textMuted}
				/>
			</Pressable>
		</View>
	)
}
