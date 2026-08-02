import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { STATION_PICKER_OPTIONS } from '@/data/area'
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
	Unknown: 'help-circle-outline',
	Solenoid: 'valve',
	Pump: 'engine-outline',
	Fertilizer: 'sprout-outline',
	Sensor: 'thermometer-lines',
}

export interface StationCardItemProps {
	station: Station
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
					title={station.name ?? stationLabel}
					titleFontWeight="600"
					subtitle={!isMqttEditable ? station.status.state : ''}
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
					// CardItem's built-in editable title input
					isEditable={isMqttEditable}
					rightElement={
						(!isMqttEditable && (
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
						)) || (
							<Picker
								label="Station Role"
								options={STATION_PICKER_OPTIONS}
								selectedValue={selectedStationType}
								onValueChange={handleTypeChange}
								isLoading={isLoading}
								disabled={!isMqttEditable}
							/>
						)
					}
					bottomElement={
						isMqttEditable ? (
							<View style={{ gap: theme.space.md }}>
								<Input
									label="Name"
									value={station.name ?? ''}
									labelBackground={theme.colors.card}
									onChangeText={(text) =>
										onDataChange?.('name', station.id, text)
									}
								/>
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
