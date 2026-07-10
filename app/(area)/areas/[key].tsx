import { useEffect, useState } from 'react'
import { RefreshControl } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { EditableAreaInfoCard } from '@/components/areas/EditableAreaInfoCard'
import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import { useTheme } from '@/context/ThemeContext'
import { Area, AreaUpdatePayload } from '@/types/area'

export interface AreaInfoScreenProps {
	name: string
	location: string
	description: string
	imageUrl?: string
}

export default function AreaInfoScreen() {
	const theme = useTheme()
	const { name, location, description, imageUrl, firmware, technicalName } =
		useLocalSearchParams() as unknown as Area
	const [isRefreshing] = useState(false)
	const [areaState, setAreaState] = useState<AreaInfoScreenProps>({
		name: '',
		location: '',
		description: '',
	})
	console.log('Area component rendered with params:', {
		name,
		location,
		description,
		imageUrl,
		firmware,
		technicalName,
	})

	const onRefresh = () => {
		//
	}

	const handleInfoChange = (field: keyof AreaUpdatePayload, value: string) => {
		setAreaState((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	useEffect(() => {
		setAreaState({
			name: name || '',
			location: location || '',
			description: description || '',
			imageUrl: imageUrl || '',
		})
	}, [name, location, description, imageUrl])

	console.log('Received area info:', {
		name,
		location,
		description,
		imageUrl,
		firmware,
		technicalName,
	})

	return (
		<KeyboardAwareScrollView
			bottomOffset={theme.space.stickyBarHeight}
			refreshControl={
				<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
			}
		>
			{/* <Card>
				<CardItem label="Firmware" leadingIcon="style">
					<Text style={{ color: theme.colors.accentBlue }}>{firmware}</Text>
				</CardItem>
			</Card> */}
			<EditableAreaInfoCard
				name={areaState.name}
				description={areaState.description}
				location={areaState.location}
				onInfoChange={handleInfoChange}
			/>
		</KeyboardAwareScrollView>
	)
}
