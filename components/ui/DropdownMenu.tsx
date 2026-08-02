import { useEffect, useRef, useState } from 'react'
import {
	Animated,
	Dimensions,
	Easing,
	LayoutChangeEvent,
	Pressable,
	Text,
	UIManager,
	View,
	findNodeHandle,
} from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Portal } from '@gorhom/portal'

import { useTheme } from '@/context/ThemeContext'
import { AreaMenuOptionValue } from '@/data/area'

import Button from './Button'

export default function DropdownMenu({
	options,
	onClick,
}: {
	options: Map<string, AreaMenuOptionValue[]>
	onClick: (option: AreaMenuOptionValue) => void
}) {
	const [isExpanded, setIsExpanded] = useState(false)
	const [anchor, setAnchor] = useState<{
		x: number
		y: number
		width: number
		height: number
	} | null>(null)
	const [menuLeft, setMenuLeft] = useState<number | null>(null)
	const [menuTop, setMenuTop] = useState<number | null>(null)
	const [menuWidth, setMenuWidth] = useState<number | null>(null)

	const wrapperRef = useRef<View | null>(null)
	const theme = useTheme()
	const windowWidth = Dimensions.get('window').width
	const windowHeight = Dimensions.get('window').height

	const [opacity, setOpacity] = useState(new Animated.Value(0))

	const lastLayout = useRef<{
		x: number
		y: number
		width: number
		height: number
	} | null>(null)

	const onWrapperLayout = (e: LayoutChangeEvent) => {
		const { x, y, width, height } = e.nativeEvent.layout
		lastLayout.current = { x, y, width, height }
	}

	const clampCoords = (x: number, y: number, w = 160, h = 0) => {
		let left = Math.max(8, Math.min(x, windowWidth - w - 8))
		let top = y
		if (top + h > windowHeight - 8) {
			top = Math.max(8, y - h)
		}
		return { left, top }
	}

	const measureAndOpen = async () => {
		const node = findNodeHandle(wrapperRef.current)

		if (!node) {
			if (lastLayout.current) {
				const rect = lastLayout.current
				const initialTop = Math.min(rect.y + rect.height, windowHeight - 8)
				const initialLeft = Math.max(8, Math.min(rect.x, windowWidth - 8))
				setAnchor(rect)
				setMenuTop(initialTop)
				setMenuLeft(initialLeft)
			}

			setIsExpanded(true)
			opacity.setValue(0)
			requestAnimationFrame(() =>
				Animated.timing(opacity, {
					toValue: 1,
					duration: 180,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}).start(),
			)
			return
		}

		UIManager.measureInWindow(
			node,
			(x: number, y: number, width: number, height: number) => {
				const rect = { x, y, width, height }
				setAnchor(rect)

				const estimatedMenuWidth = menuWidth ?? 160
				const initialTop = Math.min(y + height, windowHeight - 8)
				const desiredLeft = x

				const { left, top } = clampCoords(
					desiredLeft,
					initialTop,
					estimatedMenuWidth,
					0,
				)

				setMenuLeft(left)
				setMenuTop(top)

				setIsExpanded(true)
				opacity.setValue(0)
				requestAnimationFrame(() =>
					Animated.timing(opacity, {
						toValue: 1,
						duration: 180,
						easing: Easing.out(Easing.cubic),
						useNativeDriver: true,
					}).start(),
				)
			},
		)
	}

	const openMenu = () => {
		measureAndOpen()
	}

	const closeMenu = () => {
		Animated.timing(opacity, {
			toValue: 0,
			duration: 160,
			easing: Easing.in(Easing.cubic),
			useNativeDriver: true,
		}).start(() => {
			setIsExpanded(false)
			setAnchor(null)
			setMenuLeft(null)
			setMenuTop(null)
			setMenuWidth(null)
			opacity.setValue(0)
		})
	}

	const onMenuLayout = (e: any) => {
		const w = e.nativeEvent.layout.width
		const h = e.nativeEvent.layout.height
		setMenuWidth(w)
		if (!anchor) return

		const desiredLeft = anchor.x + anchor.width - w
		let left = desiredLeft
		if (left < 8) left = 8
		if (left + w > windowWidth - 8) left = Math.max(8, windowWidth - w - 8)
		setMenuLeft(left)

		let top = anchor.y + anchor.height
		if (top + h > windowHeight - 8) {
			top = Math.max(8, anchor.y - h)
		}
		setMenuTop(top)
	}

	useEffect(() => {
		if (!isExpanded || !anchor) return
		const initialTop = Math.min(anchor.y + anchor.height, windowHeight - 8)
		const initialLeft = Math.max(8, Math.min(anchor.x, windowWidth - 8))
		setMenuTop(initialTop)
		setMenuLeft(initialLeft)
	}, [anchor, isExpanded])

	return (
		<View>
			<View
				ref={(r) => (wrapperRef.current = r)}
				onLayout={onWrapperLayout}
				collapsable={false}
			>
				<Button
					variant="tertiary"
					modifier={['iconOnly']}
					isSubmenuOpen={isExpanded}
					onPress={openMenu}
					icon="dots-vertical"
					hapticFeedback={false}
				/>
			</View>

			{isExpanded && (
				<Portal>
					<Pressable
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 1000,
						}}
						onPress={closeMenu}
					>
						{menuLeft != null && menuTop != null ? (
							<Animated.View
								style={{
									position: 'absolute',
									left: menuLeft,
									top: menuTop,
									zIndex: 1001,
									backgroundColor: theme.colors.card,
									borderRadius: theme.radius.dropdown,
									paddingVertical: theme.space.sm,
									overflow: 'hidden',
									elevation: 4,
									opacity,
									alignSelf: 'flex-start',
									flexShrink: 0,
									flexGrow: 0,
									maxWidth: windowWidth - theme.space.lg,
								}}
								onLayout={onMenuLayout}
							>
								{Array.from(options.entries()).map(([header, values], idx) => (
									<View key={header}>
										{values.map((value, idx) => (
											<View key={value}>
												<Pressable
													onPress={() => {
														closeMenu()
														onClick(value)
													}}
													style={({ pressed }) => ({
														backgroundColor: pressed
															? theme.colors.buttonSecondary
															: 'transparent',
														paddingHorizontal: theme.space.xl,
														height: theme.space.buttonSize,
														justifyContent: 'center',
														alignItems: 'flex-start',
													})}
													hitSlop={8}
												>
													<View
														style={{
															flexDirection: 'row',
															alignItems: 'center',
															flexShrink: 0,
															gap: theme.space.sm,
														}}
													>
														<View
															style={{
																alignItems: 'center',
																justifyContent: 'flex-start',
																flexShrink: 0,
																width: 32,
															}}
														>
															{value === AreaMenuOptionValue.Edit ? (
																<MaterialCommunityIcons
																	name="pencil-outline"
																	size={28}
																	color={theme.colors.textPrimary}
																/>
															) : value === AreaMenuOptionValue.Unlink ? (
																<MaterialCommunityIcons
																	name="link-off"
																	size={28}
																	color={theme.colors.textPrimary}
																/>
															) : value === AreaMenuOptionValue.Reboot ? (
																<MaterialCommunityIcons
																	name="restart"
																	size={28}
																	color={theme.colors.textPrimary}
																/>
															) : value === AreaMenuOptionValue.Connectivity ? (
																<MaterialCommunityIcons
																	name="wifi"
																	size={24}
																	color={theme.colors.textPrimary}
																/>
															) : null}
														</View>

														<View
															style={{
																marginLeft: theme.space.x3s,
																flexShrink: 0,
															}}
														>
															<Text
																style={{
																	color: theme.colors.textPrimary,
																	fontSize: theme.font.base,
																	fontWeight: '500',
																	flexShrink: 0,
																}}
															>
																{value[0].toUpperCase() + value.slice(1)}
															</Text>
														</View>
													</View>
												</Pressable>
											</View>
										))}
									</View>
								))}
							</Animated.View>
						) : null}
					</Pressable>
				</Portal>
			)}
		</View>
	)
}
