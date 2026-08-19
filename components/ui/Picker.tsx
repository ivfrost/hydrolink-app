import { useCallback, useEffect, useRef, useState } from 'react'
import {
	Dimensions,
	findNodeHandle,
	Platform,
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
	modifier = ['outlined', 'small'],
}: PickerProps<T>) {
	const theme = useTheme()
	const anchorRef = useRef(null)
	const [isOpen, setIsOpen] = useState<boolean>(false)
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
			return
		}
		const t = setTimeout(() => measureAnchor(), 0)
		return () => clearTimeout(t)
	}, [open, measureAnchor])

	useEffect(() => {
		const sub = Dimensions.addEventListener('change', measureAnchor)
		return () => sub.remove()
	}, [measureAnchor])

	const computePortalStyle = () => {
		const screen = Dimensions.get('window')
		if (!anchorLayout) return { top: 0, left: 0, minWidth: 150 }

		const spaceBelow = screen.height - (anchorLayout.y + anchorLayout.height)
		const spaceAbove = anchorLayout.y
		const preferredHeight = drawerHeight ?? Math.min(maxHeight, 260)
		const openBelow = spaceBelow >= preferredHeight || spaceBelow >= spaceAbove

		const top = openBelow
			? anchorLayout.y + anchorLayout.height
			: Math.max(8, anchorLayout.y - preferredHeight)

		const minWidth = Math.max(anchorLayout.width, 150)
		const anchorRight = anchorLayout.x + anchorLayout.width
		const edge = 8

		// Prefer aligning the drawer's left edge with the anchor's left edge. When
		// there is not enough room on the right (e.g. the picker sits near the
		// right edge of the screen, or its selected label is short so the anchor is
		// narrow and pushed right), align the drawer's right edge with the anchor's
		// right edge instead so the list stays on screen.
		let left = Math.max(edge, anchorLayout.x)
		let maxWidth = screen.width - left - edge

		if (minWidth > maxWidth) {
			left = Math.max(edge, anchorRight - minWidth)
			maxWidth = screen.width - left - edge
		}

		return { top, left, minWidth, maxWidth }
	}

	const portalStyle = computePortalStyle()

	const close = () => setOpen(false)
	const toggle = () => setOpen(!open)

	const styles = StyleSheet.create({
		buttonRow: { flexDirection: 'row', alignItems: 'center' },
		drawer: {
			position: 'absolute',
			borderRadius: theme.radius.boxInCard,
			borderWidth: 1,
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.card,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.12,
			shadowRadius: 6,
			elevation: 12,
			zIndex: 10000,
			overflow: 'hidden',
		},
		optionItem: {
			minHeight: theme.space.buttonSize,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			flexWrap: 'nowrap',
			paddingHorizontal: theme.space.buttonHorizontalPadding,
			paddingVertical: theme.space.sm,
		},
	})

	return (
		<View style={{ position: 'relative' }}>
			<View style={styles.buttonRow}>
				<Button
					ref={anchorRef}
					modifier={modifier}
					variant="tertiary"
					onPress={toggle}
					activeOpacity={0.9}
					label={displayLabel}
					loading={isLoading}
					disabled={isLoading || disabled}
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

					<View
						style={[
							styles.drawer,
							{
								top: portalStyle.top,
								left: portalStyle.left,
								minWidth: portalStyle.minWidth,
								maxWidth: portalStyle.maxWidth,
								zIndex: 10000,
								elevation: Platform.OS === 'android' ? 20 : undefined,
								maxHeight,
							},
						]}
						onLayout={(e) => {
							const h = e.nativeEvent.layout.height
							if (h && h !== drawerHeight) setDrawerHeight(h)
						}}
					>
						<ScrollView nestedScrollEnabled style={{ maxHeight }}>
							{options.map((option, idx) => {
								const isSelected = option.value === selectedValue
								return (
									<TouchableOpacity
										key={String(option.value)}
										activeOpacity={0.9}
										onPress={() => {
											onValueChange(option.value)
											close()
										}}
										style={[
											styles.optionItem,
											{
												backgroundColor: isSelected
													? theme.colors.accentTint
													: 'transparent',
												borderBottomWidth: idx === options.length - 1 ? 0 : 1,
												borderBottomColor: theme.colors.border,
											},
										]}
									>
										{option.icon && (
											<MaterialCommunityIcons
												name={option.icon}
												size={18}
												color={
													option.iconColor ??
													(isSelected
														? theme.colors.accent
														: theme.colors.textSecondary)
												}
												style={{ marginRight: theme.space.sm }}
											/>
										)}
										<Text
											style={{
												fontSize: theme.font.base,
												fontWeight: isSelected ? '600' : '500',
												color: isSelected
													? theme.colors.accent
													: theme.colors.textSecondary,
												flex: 1,
											}}
										>
											{option.label}
										</Text>
										{isSelected && (
											<MaterialCommunityIcons
												name="check"
												size={18}
												color={theme.colors.accent}
											/>
										)}
									</TouchableOpacity>
								)
							})}
						</ScrollView>
					</View>
				</Portal>
			)}
		</View>
	)
}
