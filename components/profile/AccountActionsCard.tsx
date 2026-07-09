import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

interface AccountActionsCardProps {
	onChangeEmail: () => void
	onChangePassword: () => void
	onDeleteAccount?: () => void
}

export function AccountActionsCard({
	onChangeEmail,
	onChangePassword,
	onDeleteAccount,
}: AccountActionsCardProps) {
	const theme = useTheme()

	const styles = StyleSheet.create({
		card: {
			backgroundColor: theme.colors.card,
			borderRadius: theme.radius.card,
			overflow: 'hidden',
			elevation: 0,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.lg,
			paddingVertical: theme.space.lg,
			paddingHorizontal: theme.space.lg,
		},
		faultRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.space.lg,
			paddingVertical: theme.space.lg,
			paddingHorizontal: theme.space.lg,
			backgroundColor: theme.colors.faultBg,
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
		faultIconWrapper: {
			width: 32,
			height: 32,
			borderRadius: 10,
			backgroundColor: theme.colors.faultBg,
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
			<Pressable style={styles.faultRow} onPress={onDeleteAccount}>
				<View style={styles.faultIconWrapper}>
					<MaterialCommunityIcons
						name="account-remove-outline"
						size={18}
						color={theme.colors.fault}
					/>
				</View>
				<Text style={[styles.rowLabel, { color: theme.colors.fault }]}>
					Delete account
				</Text>
				<MaterialCommunityIcons
					name="chevron-right"
					size={20}
					color={theme.colors.fault}
				/>
			</Pressable>
		</View>
	)
}
