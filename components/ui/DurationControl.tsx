// @/components/ui/DurationControl.tsx
import React, { useEffect, useReducer, useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'

import Button from './Button'

export interface DurationControlProps {
	endTimestamp?: number
	onDurationChange: (duration: number) => void
	disabled?: boolean
}

const MIN_MINUTES = 1
const MAX_MINUTES = 60

export const DurationControl = React.memo(
	function DurationControl({
		endTimestamp,
		onDurationChange,
		disabled = false,
	}: DurationControlProps) {
		const theme = useTheme()
		const [minutes, setMinutes] = useState(15)

		// Forces a re-render once per second while counting down. remainingMs
		// itself is derived below, not stored, so there's no synchronous
		// setState call inside the effect body.
		const [, forceTick] = useReducer((c) => c + 1, 0)

		useEffect(() => {
			if (!endTimestamp) return

			const timer = setInterval(() => {
				if (endTimestamp - Date.now() <= 0) {
					clearInterval(timer)
				}
				forceTick()
			}, 1000)

			return () => clearInterval(timer)
		}, [endTimestamp])

		const remainingMs = endTimestamp
			? Math.max(0, endTimestamp - Date.now())
			: 0

		const handleAdjust = (type: 'plus' | 'minus') => {
			let next = minutes
			if (type === 'minus') {
				next = minutes === 5 ? 3 : minutes === 3 ? 1 : minutes - 5
			} else {
				next = minutes === 1 ? 3 : minutes === 3 ? 5 : minutes + 5
			}
			const clamped = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, next))
			setMinutes(clamped)
			onDurationChange(clamped)
		}

		if (endTimestamp && remainingMs > 0) {
			const totalSeconds = Math.floor(remainingMs / 1000)
			return (
				<View style={{ justifyContent: 'center' }}>
					<Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>
						{Math.floor(totalSeconds / 60)}:
						{(totalSeconds % 60).toString().padStart(2, '0')} remaining
					</Text>
				</View>
			)
		}

		return (
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: 8,
				}}
			>
				<Button
					modifier={['iconOnly', 'outlined', 'small']}
					variant="tertiary"
					disabled={disabled || minutes <= MIN_MINUTES}
					icon={
						<MaterialCommunityIcons
							name="minus"
							size={16}
							color={theme.colors.textSecondary}
						/>
					}
					onPress={() => handleAdjust('minus')}
				/>
				<Text
					style={{
						fontWeight: '500',
						color: theme.colors.textSecondary,
						width: 40,
						textAlign: 'center',
					}}
				>
					{minutes}m
				</Text>
				<Button
					modifier={['iconOnly', 'outlined', 'small']}
					variant="tertiary"
					disabled={disabled || minutes >= MAX_MINUTES}
					icon={
						<MaterialCommunityIcons
							name="plus"
							size={16}
							color={theme.colors.textSecondary}
						/>
					}
					onPress={() => handleAdjust('plus')}
				/>
			</View>
		)
	},
	(prevProps, nextProps) => {
		// Custom comparison to absolutely block unnecessary rerenders
		const areEqual =
			prevProps.endTimestamp === nextProps.endTimestamp &&
			prevProps.disabled === nextProps.disabled &&
			prevProps.onDurationChange === nextProps.onDurationChange

		return areEqual
	},
)

export default DurationControl
