import { Image, StyleSheet, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import Title from '@/components/ui/Title'
import { useTheme } from '@/context/ThemeContext'
import { AreaDbData } from '@/types/area'
import resolveImageUrl from '@/utils/resolveImageUrl'

import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { CircleMedia } from '../ui/CircleMedia'
import { RectangularMedia } from '../ui/RectangularMedia'
import Subtitle from '../ui/Subtitle'

export interface AreaHeaderProps {
	dbArea: AreaDbData
	online: boolean
}

export default function AreaHeader({ dbArea, online }: AreaHeaderProps) {
	const theme = useTheme()
	const router = useRouter()

	return (
		<View style={{ gap: theme.space.x2l, flexDirection: 'column' }}>
			<View
				style={{
					alignItems: 'center',
					gap: theme.space.xl,
				}}
			>
				{dbArea.imageUrl ? (
					<RectangularMedia
						onPress={() => router.push(`/areas/edit/${dbArea.key}`)}
						aspectRatio={16 / 9}
						isFullWidth
						ringColor={theme.colors.border}
						elevation={0}
					>
						<Image
							source={{ uri: resolveImageUrl(dbArea.imageUrl) }}
							style={StyleSheet.absoluteFill}
							resizeMode="cover"
							onError={(e) =>
								console.log(
									'Failed to load image from URI:',
									resolveImageUrl(dbArea.imageUrl),
									e.nativeEvent.error,
								)
							}
						/>

						<View
							style={{
								position: 'absolute',
								bottom: 0,
								left: 0,
								margin: theme.space.sm,
							}}
						>
							<Badge
								text={online ? 'Online' : 'Offline'}
								icon="circle"
								iconSize={8}
								color={online ? theme.colors.online : theme.colors.fault}
								backgroundColor={
									online ? theme.colors.onlineBg : theme.colors.faultBg
								}
							/>
						</View>
						<View
							style={{
								position: 'absolute',
								top: 0,
								right: 0,
								margin: theme.space.sm,
							}}
						>
							<Button
								icon="cog"
								label="Edit Area"
								variant="secondary"
								modifier={['small']}
								onPress={() => router.push(`/areas/edit/${dbArea.key}`)}
							/>
						</View>
					</RectangularMedia>
				) : (
					<CircleMedia
						size={68}
						onPress={() => {}}
						ringColor={online ? theme.colors.online : theme.colors.fault}
					>
						<View
							style={{
								backgroundColor: online
									? theme.colors.onlineBg
									: theme.colors.faultBg,
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
					</CircleMedia>
				)}

				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						width: '85%',
						paddingHorizontal: theme.space.md,
						justifyContent: 'center',
					}}
				>
					<View style={{ alignItems: 'center', flex: 1, gap: theme.space.x3s }}>
						<Title text={dbArea.friendlyName ?? dbArea.key ?? 'Unnamed Area'} />
						<Subtitle text={dbArea.locationLabel || 'Unknown Location'} />
					</View>
				</View>
			</View>
		</View>
	)
}
