import { Image, StyleSheet, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'

import { useTheme } from '@/context/ThemeContext'
import { AreaDbData } from '@/types/area'
import resolveImageUrl from '@/utils/resolveImageUrl'

import Badge from '../ui/Badge'
import { CircleMedia } from '../ui/CircleMedia'
import { RectangularMedia } from '../ui/RectangularMedia'

export interface AreaHeaderProps {
	dbArea: AreaDbData
	online: boolean
}

export default function AreaHeader({ dbArea, online }: AreaHeaderProps) {
	const theme = useTheme()
	const statusColor = online ? theme.colors.online : theme.colors.fault
	const statusBg = online ? theme.colors.onlineBg : theme.colors.faultBg

	return (
		<View style={{ gap: theme.space.lg }}>
			{/* Hero image when available */}
			{dbArea.imageUrl ? (
				<RectangularMedia
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
				</RectangularMedia>
			) : (
				/* Fallback icon when no image */
				<View style={{ paddingHorizontal: theme.space.xs, paddingTop: theme.space.md }}>
					<CircleMedia
						size={72}
						onPress={() => {}}
						ringColor={statusColor}
					>
						<View
							style={{
								backgroundColor: statusBg,
								width: '100%',
								height: '100%',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<MaterialCommunityIcons
								name={online ? 'map-marker-check' : 'map-marker-off'}
								size={40}
								color={statusColor}
							/>
						</View>
					</CircleMedia>
				</View>
			)}

			{/* Name row */}
			<View style={{ paddingHorizontal: theme.space.xs }}>
				<Text
					numberOfLines={1}
					style={{
						fontSize: theme.font.xl,
						fontWeight: '600',
						letterSpacing: -0.3,
						color: theme.colors.textPrimary,
					}}
				>
					{dbArea.friendlyName || dbArea.key || 'Unnamed Area'}
				</Text>

				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: theme.space.xs,
						marginTop: theme.space.x2s,
					}}
				>
					<MaterialCommunityIcons
						name="map-marker-outline"
						size={14}
						color={theme.colors.textMuted}
					/>
					<Text
						numberOfLines={1}
						style={{
							fontSize: theme.font.sm,
							color: theme.colors.textSecondary,
							flexShrink: 1,
						}}
					>
						{dbArea.locationLabel || 'Unknown Location'}
					</Text>
					<Badge
						text={online ? 'Online' : 'Offline'}
						icon="circle"
						iconSize={8}
						color={statusColor}
						backgroundColor={statusBg}
					/>
				</View>
			</View>
		</View>
	)
}
