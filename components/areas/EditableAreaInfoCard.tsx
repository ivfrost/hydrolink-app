import { useState } from 'react'
import { Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { AreaUpdatePayload } from '@/types/area'
import { getFormattedGPSCoordinates } from '@/utils/getFormattedGPSCoordinates'

import Button from '../ui/Button'
import EditableInfoCardItem from '../ui/EditableInfoCardItem'

interface EditableAreaInfoCardProps {
	friendlyName?: string
	locationLabel?: string
	locationCoordinates?: string
	description?: string
	onInfoChange: (field: keyof AreaUpdatePayload, value: string) => void
	initialValues?: Partial<Record<keyof AreaUpdatePayload, string>>
	onFieldConfirm?: (field: string, value: string) => void
	confirmingField?: string | null
}

export function EditableAreaInfoCard({
	friendlyName,
	locationLabel,
	locationCoordinates,
	description,
	onInfoChange,
	initialValues,
	onFieldConfirm,
	confirmingField,
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
			{friendlyName !== undefined && (
				<EditableInfoCardItem
					label="Area Name"
					text={friendlyName}
					onChangeText={(value) =>
						onInfoChange('friendlyName', value)
					}
					editable
					icon="label-outline"
					error={undefined}
					initialValue={initialValues?.friendlyName}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('friendlyName', v)
							: undefined
					}
					confirmLoading={confirmingField === 'friendlyName'}
				/>
			)}

			{description !== undefined && (
				<EditableInfoCardItem
					label="Area Description"
					text={description}
					onChangeText={(value) =>
						onInfoChange('description', value)
					}
					editable
					icon="text-box-outline"
					error={undefined}
					initialValue={initialValues?.description}
					onConfirm={
						onFieldConfirm
							? (v) => onFieldConfirm('description', v)
							: undefined
					}
					confirmLoading={confirmingField === 'description'}
				/>
			)}

			{locationLabel !== undefined && (
				<View style={{ width: '100%' }}>
					<EditableInfoCardItem
						label="Area Location"
						text={locationLabel}
						onChangeText={(value) =>
							onInfoChange('locationLabel', value)
						}
						editable
						icon="map-marker-outline"
						error={undefined}
						initialValue={initialValues?.locationLabel}
						onConfirm={
							onFieldConfirm
								? (v) => onFieldConfirm('locationLabel', v)
								: undefined
						}
						confirmLoading={confirmingField === 'locationLabel'}
					/>

					<View
						style={{
							marginVertical: theme.space.md,
							backgroundColor: theme.colors.border,
							height: 1,
						}}
					/>

					{locationCoordinates ? (
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: theme.space.x3s,
								paddingHorizontal: theme.space.md,
								paddingLeft: theme.space.lg,
								paddingBottom: theme.space.md,
							}}
						>
							<View
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: theme.space.xs,
								}}
							>
								<MaterialCommunityIcons
									name="pin"
									size={theme.space.iconSizeSm}
									color={theme.colors.textMuted}
								/>
								<Text
									style={{
										fontSize: theme.font.sm,
										color: theme.colors.textMuted,
									}}
								>
									{locationCoordinates}
								</Text>
							</View>

							<Button
								variant="tertiary"
								modifier={['outlined', 'small']}
								icon="crosshairs-gps"
								iconSize={theme.space.iconSizeSm}
								label="Pin Location"
								loading={isFetchingLocation}
								onPress={handleCaptureLocation}
							/>
						</View>
					) : (
						<View
							style={{
								flexDirection: 'row',
								justifyContent: 'flex-end',
								alignItems: 'center',
								paddingHorizontal: theme.space.md,
								paddingBottom: theme.space.md,
							}}
						>
							<Button
								variant="tertiary"
								modifier={['outlined', 'small']}
								icon="crosshairs-gps"
								iconSize={theme.space.iconSizeSm}
								label={
									isFetchingLocation
										? 'Acquiring GPS...'
										: 'Set Current Coordinates'
								}
								loading={isFetchingLocation}
								onPress={handleCaptureLocation}
							/>
						</View>
					)}
				</View>
			)}
		</View>
	)
}
