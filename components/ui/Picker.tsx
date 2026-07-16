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

type PickerOption<T> = { label: string; value: T }

type PickerProps<T> = {
	label?: string
	options: PickerOption<T>[]
	selectedValue: T
	onValueChange: (v: T) => void
	isOpen?: boolean
	onOpen?: () => void
	onRequestClose?: () => void
	maxHeight?: number
	isLoading?: boolean
}

export function Picker<T extends string | number>({
	label,
	options,
	selectedValue,
	onValueChange,
	isOpen: controlledOpen,
	onOpen,
	onRequestClose,
	maxHeight = 260,
	isLoading = false,
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

	const currentOption = options.find((o) => o.value === selectedValue)
	const displayLabel = currentOption
		? currentOption.label
		: String(selectedValue)

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
		const left = Math.max(8, anchorLayout.x)
		const maxWidth = screen.width - left - 8
		const minWidth = Math.max(anchorLayout.width, 150)

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
			height: theme.space.iconOnlyButtonSize,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: theme.space.buttonHorizontalPadding,
		},
	})

	return (
		<View style={{ position: 'relative' }}>
			<View style={styles.buttonRow}>
				<Button
					ref={anchorRef}
					modifier={['outlined', 'small']}
					variant="tertiary"
					onPress={toggle}
					activeOpacity={0.85}
					label={displayLabel}
					loading={isLoading}
					disabled={isLoading}
					iconPosition="right"
					icon={
						<MaterialCommunityIcons
							name={open ? 'chevron-up' : 'chevron-down'}
							size={20}
							color={theme.colors.textSecondary}
						/>
					}
				/>
			</View>

			{open && anchorLayout && (
				<Portal>
					<TouchableOpacity
						activeOpacity={1}
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
										activeOpacity={0.75}
										onPress={() => {
											onValueChange(option.value)
											close()
										}}
										style={[
											styles.optionItem,
											{
												backgroundColor: isSelected
													? theme.colors.accentBlueLight
													: 'transparent',
												borderBottomWidth: idx === options.length - 1 ? 0 : 1,
												borderBottomColor: theme.colors.border,
											},
										]}
									>
										<Text
											style={{
												fontSize: 14,
												fontWeight: isSelected ? '600' : '400',
												color: isSelected
													? theme.colors.accentBlue
													: theme.colors.textPrimary,
												flex: 1,
											}}
										>
											{option.label}
										</Text>
										{isSelected && (
											<MaterialCommunityIcons
												name="check"
												size={18}
												color={theme.colors.accentBlue}
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
