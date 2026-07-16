import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { ScaleDecorator } from 'react-native-draggable-flatlist'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { STATION_PICKER_OPTIONS } from '@/data/area'
import { AreaData, StationType } from '@/types/area'

import Card from '../layout/Card'
import Button from '../ui/Button'
import CardItem from '../ui/CardItem'
import DurationControl from '../ui/DurationControl'
import { Picker } from '../ui/Picker'

export interface StationCardItemProps {
	station: AreaData['stations'][number]
	isActive: boolean
	isLoading: boolean
	isActionDisabled: boolean
	espCountdown: number | undefined
	onDrag: () => void
	onActionPress: (durationMs: string) => void
	onTypeChange: (newType: StationType) => void
}

export default function StationCardItem({
	station,
	isActive,
	isLoading,
	isActionDisabled,
	espCountdown,
	onDrag,
	onActionPress,
	onTypeChange,
}: StationCardItemProps) {
	const theme = useTheme()
	const [minutes, setMinutes] = useState(15)

	const buttonVariant =
		station.status.state === 'Running' ? 'destructive' : 'primary'
	const actionIcon = station.status.state === 'Running' ? 'stop' : 'play'

	const headingIcon =
		station.type === 'Unknown'
			? 'help-circle'
			: station.type === 'Solenoid'
				? 'valve'
				: station.type === 'Pump'
					? 'water-pump'
					: station.type === 'Fertilizer'
						? 'sprout'
						: station.type === 'Sensor'
							? 'thermometer-lines'
							: 'help-circle'

	return (
		<ScaleDecorator>
			<View
				style={{
					elevation: isActive ? 20 : 0,
					overflow: 'visible',
				}}
			>
				<TouchableOpacity
					onLongPress={onDrag}
					disabled={isActive}
					activeOpacity={0.9}
				>
					<Card flexDirection="column" overflow="visible">
						<CardItem
							title={station.name ?? `Station ${station.id}`}
							subtitle={station.status.state}
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
									onPress={() => onActionPress(`${minutes * 60 * 1000}`)}
								/>
							}
							bottomElement={
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: theme.space.sm,
										justifyContent: 'space-between',
									}}
								>
									<Picker
										label="Station Role"
										options={STATION_PICKER_OPTIONS}
										selectedValue={station.type}
										onValueChange={(newType) => onTypeChange(newType)}
										isLoading={isLoading}
									/>
									{!isActionDisabled && (
										<DurationControl
											espCountdown={espCountdown}
											onDurationChange={setMinutes}
											disabled={isLoading}
										/>
									)}
								</View>
							}
						/>
					</Card>
				</TouchableOpacity>
			</View>
		</ScaleDecorator>
	)
}
