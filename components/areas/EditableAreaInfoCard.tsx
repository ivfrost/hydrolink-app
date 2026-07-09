import { View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { AreaUpdatePayload } from '@/types/area'

import EditableInfoCardItem from '../ui/EditableInfoCardItem'

interface EditableAreaInfoCardProps {
	name?: string
	location?: string
	description?: string
	onInfoChange: (field: keyof AreaUpdatePayload, value: string) => void
}

export function EditableAreaInfoCard({
	name,
	location,
	description,
	onInfoChange,
}: EditableAreaInfoCardProps) {
	const theme = useTheme()

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
			{name !== undefined && (
				<EditableInfoCardItem
					label="Area Name"
					text={name}
					onChangeText={(value) => onInfoChange('name', value)}
					editable
					icon={
						<MaterialCommunityIcons
							name="map-marker-outline"
							size={18}
							color={theme.colors.accentBlue}
						/>
					}
					error={undefined}
				/>
			)}

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
			{/* Area location: Manual coordinates or attempt estimate from device */}
			{location !== undefined && (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: theme.space.sm,
					}}
				>
					<EditableInfoCardItem
						label="Area Location"
						text={location}
						onChangeText={(value) => onInfoChange('location', value)}
						editable
						icon={
							<MaterialCommunityIcons
								name="crosshairs-gps"
								size={18}
								color={theme.colors.accentBlue}
							/>
						}
						error={undefined}
					/>
				</View>
			)}
		</View>
	)
}
