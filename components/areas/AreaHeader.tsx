import { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useHeaderHeight } from 'expo-router/build/react-navigation'

import { UpdatingLabel } from '@/components/areas/AreaCardItem'
import { useTheme } from '@/context/ThemeContext'
import { AreaDbData } from '@/types/area'
import resolveImageUrl from '@/utils/resolveImageUrl'

import Badge from '../ui/Badge'

export interface AreaHeaderProps {
	dbArea: AreaDbData
	online: boolean
	updating?: boolean
}

export default function AreaHeader({
	dbArea,
	online,
	updating = false,
}: AreaHeaderProps) {
	const theme = useTheme()
	const headerHeight = useHeaderHeight()
	const [descriptionExpanded, setDescriptionExpanded] = useState(false)
	const [descriptionNeedsToggle, setDescriptionNeedsToggle] = useState(false)
	const statusColor = updating
		? theme.colors.online
		: online
			? theme.colors.online
			: theme.colors.fault
	const statusBg = updating
		? theme.colors.onlineBg
		: online
			? theme.colors.onlineBg
			: theme.colors.faultBg

	// Name + location/status block. Shown next to the icon when no image is
	// set (profile-header style), or below the hero image when one exists.
	const renderNameBlock = () => (
		<View
			style={{
				flexShrink: 1,
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					width: '100%',
					gap: theme.space.sm,
				}}
			>
				<Text
					numberOfLines={1}
					style={{
						fontSize: theme.font.xl,
						fontWeight: '600',
						letterSpacing: -0.3,
						color: theme.colors.textPrimary,
						flexShrink: 1,
					}}
				>
					{dbArea.friendlyName || dbArea.key || 'Unnamed Area'}
				</Text>
				<Badge
					text={online ? 'Online' : 'Offline'}
					icon="circle"
					iconSize={8}
					color={statusColor}
					backgroundColor={statusBg}
				/>
			</View>

			{updating ? (
				<View style={{ marginTop: theme.space.sm }}>
					<UpdatingLabel />
				</View>
			) : (
				<View style={{ gap: theme.space.sm }}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							gap: theme.space.xs,
							marginTop: theme.space.x2s,
						}}
					>
						<Badge
							text={dbArea.key || 'Unknown Key'}
							icon="pound"
							iconSize={12}
							color={theme.colors.textMuted}
							backgroundColor={theme.colors.inputBackground}
						/>
						<Badge
							text={dbArea.locationLabel || 'Unknown Location'}
							icon="map-marker"
							iconSize={12}
							color={theme.colors.textMuted}
							backgroundColor={theme.colors.inputBackground}
						/>
					</View>
					{dbArea.description && (
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'flex-start',
								gap: theme.space.sm,
								marginTop: theme.space.sm,
								paddingEnd: theme.space.md,
								paddingStart: theme.space.md,
								paddingVertical: theme.space.sm,
								borderRadius: theme.radius.boxInCard,
								backgroundColor: theme.colors.card,
							}}
						>
							<MaterialCommunityIcons
								name="note-text-outline"
								size={16}
								color={theme.colors.textMuted}
								style={{ marginTop: 2 }}
							/>
							<View style={{ flex: 1 }}>
								<Text
									numberOfLines={
										descriptionExpanded
											? undefined
											: descriptionNeedsToggle
												? 3
												: undefined
									}
									onTextLayout={(e) => {
										if (e.nativeEvent.lines.length > 3) {
											setDescriptionNeedsToggle(true)
										}
									}}
									style={{
										flexShrink: 1,
										fontSize: theme.font.sm,
										color: theme.colors.textSecondary,
										lineHeight: theme.lineHeight.paragraph,
									}}
								>
									{dbArea.description}
								</Text>
								{descriptionNeedsToggle && (
									<Pressable
										hitSlop={8}
										onPress={() => setDescriptionExpanded((prev) => !prev)}
										style={{
											marginTop: theme.space.x2s,
											alignSelf: 'flex-start',
										}}
									>
										<Text
											style={{
												fontSize: theme.font.xs,
												fontWeight: '600',
												color: theme.colors.accent,
											}}
										>
											{descriptionExpanded ? 'Show less' : 'Read more'}
										</Text>
									</Pressable>
								)}
							</View>
						</View>
					)}
				</View>
			)}
		</View>
	)

	return (
		<View style={{ gap: theme.space.lg }}>
			{dbArea.imageUrl ? (
				<>
					{/* Full-bleed hero image — extends behind the transparent header. */}
					<View style={{ marginHorizontal: -theme.space.lg }}>
						<Image
							source={{ uri: resolveImageUrl(dbArea.imageUrl) }}
							style={{
								width: '100%',
								aspectRatio: 16 / 9,
							}}
							resizeMode="cover"
							onError={(e) =>
								console.log(
									'Failed to load image from URI:',
									resolveImageUrl(dbArea.imageUrl),
									e.nativeEvent.error,
								)
							}
						/>
						{/* Scrim: dark at top so the header text stays readable. */}
						<LinearGradient
							colors={['rgba(0,0,0,0.55)', 'transparent']}
							locations={[0, 0.55]}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
							}}
						/>
					</View>
					{/* Name block overlaps the image with rounded top corners. */}
					<View
						style={{
							marginHorizontal: -theme.space.lg,
							marginTop: -theme.space.x3l,
							backgroundColor: theme.colors.background,
							borderTopLeftRadius: theme.radius.card,
							borderTopRightRadius: theme.radius.card,
							paddingTop: theme.space.lg,
							paddingHorizontal: theme.space.md,
							paddingBottom: theme.space.lg,
						}}
					>
						{renderNameBlock()}
					</View>
				</>
			) : (
				/* No image: profile-header style - icon on the left, name and
				   location/status on the right. */
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: theme.space.xl,
						paddingTop: headerHeight + theme.space.md,
					}}
				>
					{renderNameBlock()}
				</View>
			)}
		</View>
	)
}
