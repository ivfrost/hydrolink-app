import { useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { AreaUpdatePayload } from '@/types/area'
import { getFormattedGPSCoordinates } from '@/utils/getFormattedGPSCoordinates'

import EditableInfoCardItem from '../ui/EditableInfoCardItem'

interface EditableAreaInfoCardProps {
	friendlyName?: string
	locationLabel?: string
	locationCoordinates?: string
	description?: string
	onInfoChange: (field: keyof AreaUpdatePayload, value: string) => void
}

export function EditableAreaInfoCard({
	friendlyName,
	locationLabel,
	locationCoordinates,
	description,
	onInfoChange,
}: EditableAreaInfoCardProps) {
	const theme = useTheme()
	const [isFetchingLocation, setIsFetchingLocation] = useState(false)

	const handleCaptureLocation = async () => {
		setIsFetchingLocation(true)
		const coords = await getFormattedGPSCoordinates()
		if (coords) {
			onInfoChange('locationCoordinates', coords)
		}
		setIsFetchingLocation(false)
	}

	return (
		<View
			style={{
				borderRadius: theme.radius.card,
				overflow: 'hidden',
				backgroundColor: theme.colors.card,
				width: '100%',
				elevation: 0,
			}}
		>
			{/* Friendly Name */}
			{friendlyName !== undefined && (
				<EditableInfoCardItem
					label="Area Name"
					text={friendlyName}
					onChangeText={(value) => onInfoChange('friendlyName', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="label-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
					error={undefined}
				/>
			)}

			{/* Description */}
			{description !== undefined && (
				<EditableInfoCardItem
					label="Area Description"
					text={description}
					onChangeText={(value) => onInfoChange('description', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="text-box-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
					error={undefined}
				/>
			)}

			{/* Location Input with Bottom-Right GPS Action */}
			{locationLabel !== undefined && (
				<View style={{ width: '100%' }}>
					<EditableInfoCardItem
						label="Area Location"
						text={locationLabel}
						onChangeText={(value) => onInfoChange('locationLabel', value)}
						editable
						icon={
							<MaterialCommunityIcons
								name="map-marker-outline"
								size={18}
								color={theme.colors.accentBlue}
							/>
						}
						error={undefined}
						renderBottom={() => (
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'flex-end',
									alignItems: 'center',
									gap: theme.space.sm,
									paddingHorizontal: theme.space.xl,
									paddingBottom: theme.space.md,
								}}
							>
								{locationCoordinates && (
									<Text
										style={{
											fontSize: 12,
											color: theme.colors.textMuted,
											marginRight: theme.space.xs,
										}}
									>
										{locationCoordinates}
									</Text>
								)}
								<TouchableOpacity
									onPress={handleCaptureLocation}
									disabled={isFetchingLocation}
									hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 4,
										paddingVertical: 2,
									}}
								>
									{isFetchingLocation ? (
										<ActivityIndicator
											size="small"
											style={{ maxHeight: 14 }}
											color={theme.colors.accentBlue}
										/>
									) : (
										<MaterialCommunityIcons
											name="crosshairs-gps"
											size={14}
											color={theme.colors.accentBlue}
										/>
									)}
									<Text
										style={{
											fontSize: 12,
											fontWeight: '600',
											color: theme.colors.accentBlue,
										}}
									>
										{isFetchingLocation
											? 'Acquiring GPS...'
											: 'Set Current Coordinates'}
									</Text>
								</TouchableOpacity>
							</View>
						)}
					/>
				</View>
			)}
		</View>
	)
}
