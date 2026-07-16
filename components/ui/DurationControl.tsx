import { useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import Button from './Button'

export interface DurationControlProps {
	espCountdown?: number
	onDurationChange: (duration: number) => void
	disabled?: boolean
}

export default function DurationControl({
	espCountdown,
	onDurationChange,
	disabled = false,
}: DurationControlProps) {
	const [minutes, setMinutes] = useState(15)
	const theme = useTheme()

	if (espCountdown && espCountdown > 0) {
		return (
			<Text style={{ fontWeight: '600' }}>
				{Math.floor(espCountdown / 60)}:
				{(espCountdown % 60).toString().padStart(2, '0')} remaining
			</Text>
		)
	}

	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
			<Button
				modifier={['iconOnly', 'outlined', 'small']}
				variant="tertiary"
				icon={
					<MaterialCommunityIcons
						name="minus"
						size={16}
						color={theme.colors.textSecondary}
					/>
				}
				disabled={disabled}
				onPress={() => {
					const next = Math.max(
						1,
						minutes === 5 ? 3 : minutes === 3 ? 1 : minutes - 5,
					)
					setMinutes(next)
					onDurationChange?.(next)
				}}
			/>
			<Text style={{ fontWeight: '500', color: theme.colors.textSecondary }}>
				{minutes}m
			</Text>
			<Button
				modifier={['iconOnly', 'outlined', 'small']}
				variant="tertiary"
				disabled={disabled}
				icon={
					<MaterialCommunityIcons
						name="plus"
						size={16}
						color={theme.colors.textSecondary}
					/>
				}
				onPress={() => {
					const next = Math.min(
						60,
						minutes === 1 ? 3 : minutes === 3 ? 5 : minutes + 5,
					)
					setMinutes(next)
					onDurationChange?.(next)
				}}
			/>
		</View>
	)
}
