import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import {
	isReadOnlyStationType,
	STATION_PICKER_OPTIONS,
	STATION_TYPE_LABEL,
} from '@/data/area'
import { ManualOverride, Station, StationType } from '@/types/area'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import CardItem from '../ui/CardItem'
import DurationControl from '../ui/DurationControl'
import Input from '../ui/Input'
import { Picker } from '../ui/Picker'

export const STATION_TYPE_ICON: Record<
	StationType,
	React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
	Solenoid: 'valve',
	FertilizerPump: 'water-pump',
	CaudalSensor: 'gauge',
	HumiditySensor: 'water-percent',
	Unclassified: 'help-circle-outline',
}

export interface StationCardItemProps {
	station: Station
	isActive?: boolean
	isLoading: boolean
	isActionDisabled?: boolean
	manualOverride?: ManualOverride
	onDrag?: () => void
	onActionPress?: (action: 'Start' | 'Stop', durationMs: number) => void
	onDataChange?: (
		field: 'name' | 'description' | 'imageUrl' | 'type',
		stationId: number,
		newValue: string,
	) => void
	/** Commits a field immediately (MQTT + state machine), used by the
	 *  dropdown (on change) and the inline confirm button (on press). */
	onFieldCommit?: (
		field: 'name' | 'description' | 'imageUrl' | 'type',
		value: string,
	) => void
	/** Original name from the live station, used to show the confirm button only
	 *  when the draft name differs. */
	initialName?: string
	isEditable?: boolean
	isMqttEditable?: boolean
	newLeadingIcon?: (typeof STATION_TYPE_ICON)[StationType]
}

export default function StationCardItem({
	station,
	isActive = false,
	isLoading,
	isActionDisabled = true,
	manualOverride,
	onDrag,
	onActionPress,
	onDataChange,
	onFieldCommit,
	initialName,
	isMqttEditable = false,
	newLeadingIcon,
}: StationCardItemProps) {
	const theme = useTheme()
	const [minutes, setMinutes] = useState(15)
	const [selectedStationType, setSelectedStationType] = useState<StationType>(
		station.type,
	)

	const handleTypeChange = (newType: StationType) => {
		setSelectedStationType(newType)
		onDataChange?.('type', station.id, newType)
		onFieldCommit?.('type', newType)
	}

	// Sensors and unclassified stations are read-only: no start/stop or timer.
	const isReadOnly = isReadOnlyStationType(station.type)

	const isRunning = station.status.state === 'Running'
	// A manual override only counts as an active countdown while the station is
	// actually running. The ESP may leave a stale `active` flag after a Stop, so
	// an idle station never shows a countdown or a stop button.
	const isOverrideActive =
		isRunning && !!(manualOverride?.active && manualOverride.end)

	const buttonVariant = isRunning ? 'destructive' : 'primary'
	const actionIcon = isRunning ? 'stop' : 'play'
	const headingIcon = newLeadingIcon ?? STATION_TYPE_ICON[station.type]

	const stationLabel = `Station ${station.id + 1}`

	return (
		<View style={{ elevation: isActive ? 20 : 0, overflow: 'visible' }}>
			<TouchableOpacity
				onLongPress={onDrag}
				disabled={isActive}
				activeOpacity={0.9}
				style={{
					flexDirection: 'row',
					alignItems: 'flex-start',
					marginLeft: onDrag ? -theme.space.xs : 0,
					gap: theme.space.sm,
				}}
			>
				{!!onDrag && (
					<MaterialIcons
						name="drag-indicator"
						size={24}
						color="gray"
						style={{ marginRight: 2, marginTop: theme.space.x2l }}
					/>
				)}
				<CardItem
					title={station.name?.trim() ? station.name : stationLabel}
					titleFontWeight="600"
					subtitle={!isMqttEditable ? station.status.state : ''}
					icon={headingIcon}
					statusColor={
						station.status.state === 'Running'
							? theme.colors.running
							: theme.colors.offline
					}
					statusBg={
						station.status.state === 'Running'
							? theme.colors.runningBg
							: theme.colors.offlineBg
					}
					rightElement={
						isMqttEditable ? (
							<Picker
								label="Station Role"
								options={STATION_PICKER_OPTIONS}
								selectedValue={selectedStationType}
								onValueChange={handleTypeChange}
								isLoading={isLoading}
								disabled={!isMqttEditable}
							/>
						) : isReadOnly ? (
							// Sensors are read-only; a live reading will be
							// shown here in the future.
							<Text
								style={{
									color: theme.colors.textMuted,
									fontSize: theme.font.sm,
								}}
							>
								—
							</Text>
						) : (
							<Button
								modifier={['iconOnly']}
								variant={buttonVariant}
								disabled={isActionDisabled}
								loading={isLoading}
								icon={
									<MaterialCommunityIcons
										name={actionIcon}
										size={26}
										color="white"
									/>
								}
								onPress={() =>
									onActionPress?.(
										isRunning ? 'Stop' : 'Start',
										minutes * 60 * 1000,
									)
								}
							/>
						)
					}
					bottomElement={
						isMqttEditable ? (
							<View style={{ gap: theme.space.md }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.xs,
									}}
								>
									<View style={{ flex: 1 }}>
										<Input
											label="Name"
											value={station.name ?? ''}
											labelBackground={theme.colors.card}
											onChangeText={(text) =>
												onDataChange?.('name', station.id, text)
											}
										/>
									</View>
									{onFieldCommit && station.name !== initialName && (
										<Button
											variant="confirm"
											onPress={() => onFieldCommit('name', station.name ?? '')}
										/>
									)}
								</View>
							</View>
						) : (
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'flex-end',
									justifyContent: 'space-between',
									minHeight: theme.space.smallButtonSize,
									gap: theme.space.sm,
								}}
							>
								<Badge
									text={STATION_TYPE_LABEL[station.type]}
									color={theme.colors.textSecondary}
									backgroundColor={''}
									borderColor={theme.colors.border}
								/>

								{!isReadOnly && !isActionDisabled && (
									<DurationControl
										endTimestamp={
											isOverrideActive ? manualOverride.end : undefined
										}
										onDurationChange={setMinutes}
										disabled={isLoading}
									/>
								)}
							</View>
						)
					}
				/>
			</TouchableOpacity>
		</View>
	)
}
