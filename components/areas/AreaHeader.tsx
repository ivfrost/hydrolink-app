import { Image, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import Subtitle from '@/components/ui/Subtitle'
import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'
import { Area } from '@/types/area'

import { CircleMedia } from '../ui/CircleMedia'

export interface AreaHeaderProps {
	area: Area
	online: boolean
	location?: string
	lastUpdatedStr: string
}

export default function AreaHeader({
	area,
	online,
	location,
	lastUpdatedStr,
}: AreaHeaderProps) {
	const theme = useTheme()

	return (
		<View style={{ gap: theme.space.x2l, flexDirection: 'column' }}>
			<View
				style={{
					alignItems: 'center',
					gap: theme.space.md,
				}}
			>
				<CircleMedia
					size={64}
					onPress={() => {}}
					ringColor={online ? theme.colors.online : theme.colors.fault}
				>
					{area.imageUrl ? (
						<Image
							source={{ uri: area.imageUrl }}
							style={{ width: 64, height: 64, borderRadius: 32 }}
							resizeMode="cover"
						/>
					) : (
						<View
							style={{
								backgroundColor: online
									? theme.colors.onlineBg
									: theme.colors.faultBg,
								borderRadius: 32,
								width: '100%',
								height: '100%',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<MaterialCommunityIcons
								name={online ? 'map-marker-check' : 'map-marker-off'}
								size={36}
								color={online ? theme.colors.online : theme.colors.fault}
							/>
						</View>
					)}
				</CircleMedia>
				<View style={{ alignItems: 'center', gap: theme.space.x2s }}>
					<Title text={area.name ?? area.key ?? 'Unnamed Area'} />
					<Subtitle text={location} />
				</View>
			</View>
		</View>
	)
}
