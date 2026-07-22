import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { STATION_PICKER_OPTIONS } from '@/data/area'
import { AreaMqttData, ManualOverride, StationType } from '@/types/area'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import CardItem from '../ui/CardItem'
import DurationControl from '../ui/DurationControl'
import { Picker } from '../ui/Picker'

export const STATION_TYPE_ICON: Record<
	StationType,
	React.ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
	Unknown: 'help-circle',
	Solenoid: 'valve',
	Pump: 'water-pump',
	Fertilizer: 'sprout',
	Sensor: 'thermometer-lines',
}

export interface StationCardItemProps {
	station: AreaMqttData['stations'][number]
	isActive?: boolean
	isLoading: boolean
	isActionDisabled?: boolean
	manualOverride?: ManualOverride
	onDrag?: () => void
	onActionPress?: (durationMs: number) => void
	onDataChange?: (
		field: 'name' | 'description' | 'imageUrl' | 'type',
		stationId: number,
		newValue: string,
	) => void
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
	isEditable = false,
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
	}

	const isOverrideActive = !!(manualOverride?.active && manualOverride.end)

	const buttonVariant =
		station.status.state === 'Running' ? 'destructive' : 'primary'
	const actionIcon = station.status.state === 'Running' ? 'stop' : 'play'
	const headingIcon = newLeadingIcon ?? STATION_TYPE_ICON[station.type]

	return (
		<View style={{ elevation: isActive ? 20 : 0, overflow: 'visible' }}>
			<TouchableOpacity
				onLongPress={onDrag ? onDrag : undefined}
				disabled={isActive}
				activeOpacity={0.9}
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					marginLeft: onDrag ? -theme.space.xs : 0,
					gap: theme.space.xs,
				}}
			>
				{!!onDrag && (
					<MaterialIcons
						name="drag-handle"
						size={28}
						color={theme.colors.textMuted}
					/>
				)}
				<CardItem
					title={station.name ?? `Station ${station.id}`}
					subtitle={!isEditable ? station.status.state : ''}
					icon={headingIcon}
					statusColor={
						station.status.state === 'Running'
							? theme.colors.active
							: theme.colors.offline
					}
					statusBg={
						station.status.state === 'Running'
							? theme.colors.activeBg
							: theme.colors.offlineBg
					}
					rightElement={
						isEditable ? (
							<Picker
								label="Station Role"
								options={STATION_PICKER_OPTIONS}
								selectedValue={selectedStationType}
								onValueChange={handleTypeChange}
								isLoading={isLoading}
								disabled={!isMqttEditable}
							/>
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
								onPress={() => onActionPress?.(minutes * 60 * 1000)}
							/>
						)
					}
					bottomElement={
						!isEditable && (
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'flex-end',
									gap: theme.space.sm,
									justifyContent: 'space-between',
								}}
							>
								<Badge
									text={station.type}
									color={theme.colors.textSecondary}
									backgroundColor={''}
									borderColor={theme.colors.border}
								/>
								{!isActionDisabled && (
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
