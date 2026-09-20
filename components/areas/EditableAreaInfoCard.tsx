import { useState } from 'react'
import { View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'
import { AreaUpdatePayload } from '@/types/area'
import { getFormattedGPSCoordinates } from '@/utils/getFormattedGPSCoordinates'

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
				backgroundColor: theme.colors.surfaceRaised,
				width: '100%',
				elevation: 0,
			}}
		>
			{friendlyName !== undefined && (
				<EditableInfoCardItem
					label={t('profile.areaName')}
					text={friendlyName}
					onChangeText={(value) => onInfoChange('friendlyName', value)}
					editable
					maxLength={40}
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
					label={t('profile.areaDescription')}
					text={description}
					onChangeText={(value) => onInfoChange('description', value)}
					editable
					multiline
					numberOfLines={3}
					textAlignVertical="top"
					maxLength={255}
					icon="text-box-outline"
					error={undefined}
					initialValue={initialValues?.description}
					onConfirm={
						onFieldConfirm ? (v) => onFieldConfirm('description', v) : undefined
					}
					confirmLoading={confirmingField === 'description'}
				/>
			)}

			{locationLabel !== undefined && (
				<View style={{ width: '100%' }}>
					<EditableInfoCardItem
						label={t('profile.areaLocation')}
						text={locationLabel}
						onChangeText={(value) => onInfoChange('locationLabel', value)}
						editable
						maxLength={255}
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

					{/* <View
						style={{
							marginVertical: theme.space.md,
							backgroundColor: theme.colors.outline,
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
							<Button
								variant="tertiary"
								modifier={['outlined', 'small']}
								icon="crosshairs-gps"
								iconSize={theme.space.iconSizeSm}
								label={t('profile.pinLocation')}
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
					)}*/}
				</View>
			)}
		</View>
	)
}
