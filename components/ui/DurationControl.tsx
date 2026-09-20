import React, { useEffect, useReducer, useState } from 'react'
import { Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

import { Picker } from './Picker'

export interface DurationControlProps {
	endTimestamp?: number
	onDurationChange: (duration: number) => void
	disabled?: boolean
}

const MIN_MINUTES = 1
const MAX_MINUTES = 60
const DURATION_OPTIONS = [1, 3, 5, 10, 15, 30, 60].map((value) => ({
	label: `${value} min`,
	value,
}))

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

		const handleDurationChange = (next: number) => {
			const clamped = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, next))
			setMinutes(clamped)
			onDurationChange(clamped)
		}

		if (endTimestamp && remainingMs > 0) {
			const totalSeconds = Math.floor(remainingMs / 1000)
			return (
				<View style={{ justifyContent: 'center' }}>
					<Text
						style={{
							fontWeight: theme.fontWeight.semibold,
							color: theme.colors.textPrimary,
						}}
					>
						{Math.floor(totalSeconds / 60)}:
						{(totalSeconds % 60).toString().padStart(2, '0')} remaining
					</Text>
				</View>
			)
		}

		return (
			<View style={{ alignSelf: 'flex-end', width: 104 }}>
				<Picker
					modifier={['outlined', 'small', 'full']}
					options={DURATION_OPTIONS}
					selectedValue={minutes}
					onValueChange={handleDurationChange}
					disabled={disabled}
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
