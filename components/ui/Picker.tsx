import { useCallback, useEffect, useRef, useState } from 'react'
import {
	Animated,
	Dimensions,
	findNodeHandle,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	UIManager,
	View,
} from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Portal } from '@gorhom/portal'

import { useTheme } from '@/context/ThemeContext'

import Button from './Button'

type PickerOption<T> = {
	label: string
	value: T
	icon?: keyof typeof MaterialCommunityIcons.glyphMap
	iconColor?: string
}

type PickerModifier = 'tall' | 'full' | 'small' | 'outlined'

type PickerProps<T> = {
	label?: string
	options: PickerOption<T>[]
	selectedValue: T | null
	onValueChange: (v: T) => void
	placeholder?: string
	isOpen?: boolean
	onOpen?: () => void
	onRequestClose?: () => void
	maxHeight?: number
	isLoading?: boolean
	disabled?: boolean
	onDisabledPress?: () => void
	modifier?: PickerModifier[]
}

export function Picker<T extends string | number>({
	label,
	options,
	selectedValue,
	onValueChange,
	placeholder,
	isOpen: controlledOpen,
	onOpen,
	onRequestClose,
	maxHeight = 260,
	isLoading = false,
	disabled = false,
	onDisabledPress,
	modifier = ['outlined', 'small'],
}: PickerProps<T>) {
	const theme = useTheme()
	const anchorRef = useRef(null)
	const [isOpen, setIsOpen] = useState<boolean>(false)
	const [menuOpacity] = useState(() => new Animated.Value(0))
	const open = controlledOpen ?? isOpen
	const setOpen = (v: boolean) => {
		if (controlledOpen === undefined) setIsOpen(v)
		if (v) onOpen?.()
		if (!v) onRequestClose?.()
	}

	const [anchorLayout, setAnchorLayout] = useState<{
		x: number
		y: number
		width: number
		height: number
	} | null>(null)
	const [drawerHeight, setDrawerHeight] = useState<number | null>(null)
	const pickerMenuWidth = 176

	const currentOption =
		selectedValue != null
			? options.find((o) => o.value === selectedValue)
			: undefined
	const displayLabel = currentOption
		? currentOption.label
		: selectedValue != null
			? String(selectedValue)
			: (placeholder ?? 'Select…')

	const measureAnchor = useCallback(() => {
		const node = findNodeHandle(anchorRef.current)
		if (!node) return
		UIManager.measureInWindow(
			node,
			(x: number, y: number, width: number, height: number) => {
				setAnchorLayout({ x, y, width, height })
			},
		)
	}, [])

	useEffect(() => {
		if (!open) {
			setAnchorLayout(null)
			menuOpacity.setValue(0)
			return
		}
		menuOpacity.setValue(0)
		Animated.timing(menuOpacity, {
			toValue: 1,
			duration: 180,
			useNativeDriver: true,
		}).start()
		const t = setTimeout(() => measureAnchor(), 0)
		return () => clearTimeout(t)
	}, [open, measureAnchor, menuOpacity])

	useEffect(() => {
		const sub = Dimensions.addEventListener('change', measureAnchor)
		return () => sub.remove()
	}, [measureAnchor])

	const computePortalStyle = () => {
		const screen = Dimensions.get('window')
		if (!anchorLayout) return { top: 0, left: 8, width: 150 }

		const spaceBelow = screen.height - (anchorLayout.y + anchorLayout.height)
		const spaceAbove = anchorLayout.y
		const preferredHeight = drawerHeight ?? Math.min(maxHeight, 260)
		const openBelow = spaceBelow >= preferredHeight || spaceBelow >= spaceAbove

		const top = openBelow
			? anchorLayout.y + anchorLayout.height
			: Math.max(8, anchorLayout.y - preferredHeight)

		const anchorRight = anchorLayout.x + anchorLayout.width
		const edge = 8
		const left = Math.max(
			edge,
			Math.min(
				anchorRight - pickerMenuWidth,
				screen.width - pickerMenuWidth - edge,
			),
		)

		return { top, left }
	}

	const portalStyle = computePortalStyle()

	const close = () => setOpen(false)
	const toggle = () => setOpen(!open)

	const styles = StyleSheet.create({
		buttonRow: { flexDirection: 'row', alignItems: 'center' },
		drawer: {
			position: 'absolute',
			borderRadius: theme.radius.dropdown,
			backgroundColor: theme.colors.surfaceRaised,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.16,
			shadowRadius: 8,
			elevation: 6,
			zIndex: 10000,
			overflow: 'hidden',
			paddingVertical: theme.space.sm,
		},
		optionItem: {
			height: theme.space.buttonSize,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			flexWrap: 'nowrap',
			paddingHorizontal: theme.space.xl,
		},
	})

	return (
		<View style={{ position: 'relative' }}>
			<View style={styles.buttonRow}>
				<Button
					ref={anchorRef}
					modifier={modifier}
					variant="tertiary"
					activeOpacity={0.9}
					label={displayLabel}
					loading={isLoading}
					disabled={isLoading || disabled}
					allowDisabledPress={!!onDisabledPress && disabled && !isLoading}
					onPress={
						disabled && !isLoading && onDisabledPress ? onDisabledPress : toggle
					}
					iconPosition="right"
					icon={
						<MaterialCommunityIcons
							name={open ? 'chevron-up' : 'chevron-down'}
							size={theme.space.iconSize}
							color={theme.colors.textSecondary}
						/>
					}
				/>
			</View>

			{open && anchorLayout && (
				<Portal>
					<TouchableOpacity
						activeOpacity={0.9}
						onPress={close}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 9998,
						}}
					/>

					<Animated.View
						style={[
							styles.drawer,
							{
								opacity: menuOpacity,
								top: portalStyle.top,
								left: portalStyle.left,
								width: pickerMenuWidth,
								zIndex: 10000,
								maxHeight,
							},
						]}
						onLayout={(e) => {
							const h = e.nativeEvent.layout.height
							if (h && h !== drawerHeight) setDrawerHeight(h)
						}}
					>
						<ScrollView nestedScrollEnabled style={{ maxHeight }}>
							{options.map((option) => {
								const isSelected = option.value === selectedValue
								return (
									<Pressable
										key={String(option.value)}
										onPress={() => {
											onValueChange(option.value)
											close()
										}}
										style={({ pressed }) => [
											styles.optionItem,
											{
												backgroundColor: pressed
													? theme.colors.accentTint
													: isSelected
														? theme.colors.accentTint
														: 'transparent',
											},
										]}
									>
										<View
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												flexShrink: 0,
												gap: theme.space.sm,
												width: '100%',
											}}
										>
											{option.icon && (
												<View
													style={{
														alignItems: 'center',
														justifyContent: 'flex-start',
														flexShrink: 0,
														width: 32,
													}}
												>
													<MaterialCommunityIcons
														name={option.icon}
														size={18}
														color={option.iconColor ?? theme.colors.textPrimary}
													/>
												</View>
											)}
											<Text
												style={{
													color: theme.colors.textPrimary,
													fontSize: theme.font.base,
													fontWeight: theme.fontWeight.medium,
													flex: 1,
												}}
											>
												{option.label}
											</Text>
											{isSelected && (
												<MaterialCommunityIcons
													name="check"
													size={18}
													color={theme.colors.textPrimary}
												/>
											)}
										</View>
									</Pressable>
								)
							})}
						</ScrollView>
					</Animated.View>
				</Portal>
			)}
		</View>
	)
}
