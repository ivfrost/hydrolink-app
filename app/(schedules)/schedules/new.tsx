import { useEffect, useMemo, useRef, useState } from 'react'
import {
	Alert,
	ScrollView as RNScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import { useLocalSearchParams, useRouter } from 'expo-router'

import KeyboardAwareScrollView from '@/components/layout/KeyboardAwareScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Picker } from '@/components/ui/Picker'
import SectionTitle from '@/components/ui/SectionTitle'
import { tanstackKeys } from '@/constants'
import { useTheme } from '@/context/ThemeContext'
import { STATION_TYPE_LABEL } from '@/data/area'
import { useAreaMqttData } from '@/hooks/useAreaMqttData'
import { t } from '@/i18n'
import {
	scheduleDeleteMutationFn,
	scheduleUpsertMutationFn,
} from '@/mutations/schedule'
import { areaScheduleQueryFn } from '@/queries/schedule'
import { AppError } from '@/types/api'
import type {
	LinkedReferencePoint,
	TimeWindowRequest,
	TimeWindowStartType,
} from '@/types/schedule'

/** One window being composed in the UI before it is submitted. */
interface DraftWindow {
	key: string
	pin: number
	startType: TimeWindowStartType
	fixedTime?: string
	linkedPin?: number
	linkedReferencePoint?: LinkedReferencePoint
	offsetMinutes?: number
	durationMinutes: number
}

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
	label: String(hour).padStart(2, '0'),
	value: hour,
}))

const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => ({
	label: String(minute).padStart(2, '0'),
	value: minute,
}))

function toIsoDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function nextSevenDays(): { label: string; value: string }[] {
	return Array.from({ length: 7 }, (_, offset) => {
		const date = new Date()
		date.setDate(date.getDate() + offset)
		return {
			label:
				offset === 0
					? 'Today'
					: date.toLocaleDateString(undefined, {
							weekday: 'short',
							day: 'numeric',
						}),
			value: toIsoDate(date),
		}
	})
}

function formatTime(hour: number, minute: number): string {
	return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function scheduleStartDate(
	date: string,
	window: DraftWindow,
	byPin: Map<number, DraftWindow>,
	visiting = new Set<number>(),
): Date | null {
	if (window.startType === 'FIXED' && window.fixedTime) {
		const [hours, minutes] = window.fixedTime.split(':').map(Number)
		const result = new Date(`${date}T00:00:00`)
		result.setHours(hours, minutes, 0, 0)
		return result
	}

	if (
		window.startType !== 'RELATIVE' ||
		window.linkedPin === undefined ||
		visiting.has(window.pin)
	) {
		return null
	}

	const linkedWindow = byPin.get(window.linkedPin)
	if (!linkedWindow) return null
	visiting.add(window.pin)
	const linkedStart = scheduleStartDate(date, linkedWindow, byPin, visiting)
	visiting.delete(window.pin)
	if (!linkedStart) return null

	const offset = window.offsetMinutes ?? 0
	if (window.linkedReferencePoint === 'END') {
		linkedStart.setMinutes(
			linkedStart.getMinutes() + linkedWindow.durationMinutes,
		)
	}
	linkedStart.setMinutes(linkedStart.getMinutes() + offset)
	return linkedStart
}

export default function NewScheduleScreen() {
	const theme = useTheme()
	const router = useRouter()
	const queryClient = useQueryClient()
	const { areaKey, editDate } = useLocalSearchParams() as {
		areaKey: string
		editDate?: string
	}
	const { allStations } = useAreaMqttData(areaKey)

	const dates = useMemo(() => nextSevenDays(), [])
	const [selectedDate, setSelectedDate] = useState(editDate || dates[0].value)
	const [windows, setWindows] = useState<DraftWindow[]>([])
	const initializedEditRef = useRef(false)
	const { data: existingSchedules } = useQuery({
		queryKey: ['schedules', areaKey],
		queryFn: () => areaScheduleQueryFn(areaKey),
		enabled: Boolean(areaKey && editDate),
	})

	useEffect(() => {
		if (!editDate || initializedEditRef.current || !existingSchedules) return
		const existing = existingSchedules.find(
			(schedule) => schedule.date === editDate,
		)
		if (existing) {
			setWindows(
				existing.windows.map((window) => ({
					key: `existing-${window.id}`,
					pin: window.pin,
					startType: window.startType,
					fixedTime: window.fixedTime ?? undefined,
					linkedPin: window.linkedPin ?? undefined,
					linkedReferencePoint: window.linkedReferencePoint ?? 'START',
					offsetMinutes: window.offsetMinutes ?? undefined,
					durationMinutes: window.durationMinutes,
				})),
			)
		}
		initializedEditRef.current = true
	}, [editDate, existingSchedules])

	// Window composer state
	const [stationId, setStationId] = useState<number | null>(null)
	const [startType, setStartType] = useState<TimeWindowStartType>('FIXED')
	const [hour, setHour] = useState(8)
	const [minute, setMinute] = useState(0)
	const [linkedPin, setLinkedPin] = useState<number | null>(null)
	const [reference, setReference] = useState<LinkedReferencePoint>('START')
	const [offsetMinutes, setOffsetMinutes] = useState('15')
	const [durationMinutes, setDurationMinutes] = useState('15')

	const stationOptions = allStations.map((station) => ({
		label: `${station.name?.trim() || t('stations.stationFallback').replace('{value}', String(station.id + 1))} · Pin ${station.id}`,
		value: station.id,
	}))

	const stationName = (pin: number) => {
		const station = allStations.find((item) => item.id === pin)
		return (
			station?.name?.trim() ||
			t('stations.stationFallback').replace('{value}', String(pin + 1))
		)
	}
	const stationDetails = (pin: number) => {
		const station = allStations.find((item) => item.id === pin)
		return station
			? `Pin ${station.id} · ${STATION_TYPE_LABEL[station.type]}`
			: ''
	}
	const linkedStationOptions = stationOptions.filter(
		(option) =>
			option.value !== stationId &&
			windows.some((window) => window.pin === option.value),
	)

	const mutation = useMutation({
		mutationFn: ({
			windows: requestWindows,
		}: {
			windows: TimeWindowRequest[]
		}) => scheduleUpsertMutationFn(areaKey, selectedDate, requestWindows),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tanstackKeys.SCHEDULES })
			Burnt.toast({ title: t('schedules.scheduleSaved'), preset: 'done' })
			if (router.canGoBack()) router.back()
		},
		onError: (error: AppError) => {
			Burnt.toast({
				title: error?.message || t('schedules.failedToSave'),
				preset: 'error',
			})
		},
	})
	const deleteMutation = useMutation({
		mutationFn: () => scheduleDeleteMutationFn(areaKey, selectedDate),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tanstackKeys.SCHEDULES })
			Burnt.toast({ title: t('schedules.scheduleDeleted'), preset: 'done' })
			if (router.canGoBack()) router.back()
		},
		onError: (error: AppError) => {
			Burnt.toast({
				title: error?.message || t('schedules.failedToDelete'),
				preset: 'error',
			})
		},
	})

	const handleAddWindow = () => {
		if (stationId === null) {
			Burnt.toast({ title: t('schedules.pickStation'), preset: 'error' })
			return
		}

		const duration = Number.parseInt(durationMinutes, 10)
		if (!Number.isFinite(duration) || duration < 1) {
			Burnt.toast({
				title: t('schedules.durationMinimum'),
				preset: 'error',
			})
			return
		}

		const draft: DraftWindow = {
			key: `${Date.now()}-${windows.length}`,
			pin: stationId,
			startType,
			durationMinutes: duration,
		}

		if (startType === 'FIXED') {
			draft.fixedTime = formatTime(hour, minute)
		} else {
			if (
				linkedPin === null ||
				linkedPin === stationId ||
				!windows.some((window) => window.pin === linkedPin)
			) {
				Burnt.toast({
					title: t('schedules.pickExistingReference'),
					preset: 'error',
				})
				return
			}
			const offset = Number.parseInt(offsetMinutes, 10)
			if (!Number.isFinite(offset)) {
				Burnt.toast({ title: t('schedules.offsetNumber'), preset: 'error' })
				return
			}
			draft.linkedPin = linkedPin
			draft.linkedReferencePoint = reference
			draft.offsetMinutes = offset
		}

		const candidateWindows = [...windows, draft]
		const candidateStart = scheduleStartDate(
			selectedDate,
			draft,
			new Map(candidateWindows.map((window) => [window.pin, window])),
		)
		if (candidateStart && candidateStart.getTime() <= Date.now()) {
			Burnt.toast({
				title: t('schedules.cannotScheduleInPast'),
				preset: 'error',
			})
			return
		}

		setWindows((prev) => [...prev, draft])
	}

	const handleRemoveWindow = (key: string) => {
		setWindows((prev) => prev.filter((window) => window.key !== key))
	}

	const handleSave = () => {
		if (windows.length === 0) {
			Burnt.toast({
				title: t('schedules.addAtLeastOneWindow'),
				preset: 'error',
			})
			return
		}

		const windowPins = new Set(windows.map((window) => window.pin))
		const hasInvalidReference = windows.some(
			(window) =>
				window.startType === 'RELATIVE' &&
				(window.linkedPin === undefined ||
					window.linkedPin === window.pin ||
					!windowPins.has(window.linkedPin)),
		)
		if (hasInvalidReference) {
			Burnt.toast({
				title: t('schedules.pickExistingReference'),
				preset: 'error',
			})
			return
		}
		const windowsByPin = new Map(windows.map((window) => [window.pin, window]))
		const hasPastWindow = windows.some((window) => {
			const start = scheduleStartDate(selectedDate, window, windowsByPin)
			return start !== null && start.getTime() <= Date.now()
		})
		if (hasPastWindow) {
			Burnt.toast({
				title: t('schedules.cannotScheduleInPast'),
				preset: 'error',
			})
			return
		}

		const payload: TimeWindowRequest[] = windows.map((window) => ({
			pin: window.pin,
			startType: window.startType,
			durationMinutes: window.durationMinutes,
			...(window.startType === 'FIXED'
				? { fixedTime: window.fixedTime }
				: {
						linkedPin: window.linkedPin,
						linkedReferencePoint: window.linkedReferencePoint,
						offsetMinutes: window.offsetMinutes,
					}),
		}))

		mutation.mutate({ windows: payload })
	}

	const handleDelete = () => {
		Alert.alert(
			t('schedules.deleteSchedule'),
			t('schedules.deleteScheduleConfirmation'),
			[
				{ text: t('common.discard'), style: 'cancel' },
				{
					text: t('common.remove'),
					style: 'destructive',
					onPress: () => deleteMutation.mutate(),
				},
			],
		)
	}

	return (
		<KeyboardAwareScrollView headerTransparent>
			<View style={{ gap: theme.space.x2s }}>
				<SectionTitle
					text={editDate ? t('schedules.schedules') : t('schedules.area')}
				/>
				<Text style={{ color: theme.colors.textPrimary }}>
					{areaKey || t('common.noAreaSelected')}
				</Text>
			</View>

			<View>
				<SectionTitle text={t('common.date')} />
				<RNScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: theme.space.xs }}
				>
					{dates.map((date) => {
						const selected = date.value === selectedDate
						return (
							<TouchableOpacity
								key={date.value}
								onPress={() => setSelectedDate(date.value)}
								style={{
									paddingHorizontal: theme.space.md,
									paddingVertical: theme.space.sm,
									borderRadius: theme.radius.pill,
									borderWidth: 1,
									borderColor: selected
										? theme.colors.accent
										: theme.colors.outline,
									backgroundColor: selected
										? theme.colors.accent
										: 'transparent',
								}}
							>
								<Text
									style={{
										color: selected
											? theme.colors.buttonPrimaryText
											: theme.colors.textPrimary,
										fontWeight: theme.fontWeight.medium,
									}}
								>
									{date.label}
								</Text>
							</TouchableOpacity>
						)
					})}
				</RNScrollView>
			</View>

			<View>
				<SectionTitle text={t('common.windows')} />
				{windows.length === 0 ? (
					<Text style={{ color: theme.colors.textSecondary }}>
						{t('schedules.noWindowsForDay')}
					</Text>
				) : (
					<View style={{ gap: theme.space.sm }}>
						{windows.map((window) => (
							<View
								key={window.key}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: theme.space.sm,
									padding: theme.space.md,
									borderRadius: theme.radius.boxInCard,
									backgroundColor: theme.colors.surfaceRaised,
									borderWidth: 1,
									borderColor: theme.colors.outline,
								}}
							>
								<View style={{ flex: 1 }}>
									<Text
										style={{
											color: theme.colors.textPrimary,
											fontWeight: theme.fontWeight.medium,
										}}
									>
										{stationName(window.pin)}
									</Text>
									<Text style={{ color: theme.colors.textMuted }}>
										{stationDetails(window.pin)}
									</Text>
									<Text style={{ color: theme.colors.textSecondary }}>
										{window.startType === 'FIXED'
											? `${t('schedules.at')} ${window.fixedTime}`
											: `${window.offsetMinutes ?? 0} ${t('schedules.minutesFrom')} ${
													window.linkedPin !== undefined
														? stationName(window.linkedPin)
														: '—'
												} ${window.linkedReferencePoint === 'END' ? t('schedules.ends') : t('schedules.starts').toLowerCase()}`}{' '}
										· {window.durationMinutes} {t('schedules.minutes')}
									</Text>
								</View>
								<TouchableOpacity
									hitSlop={20}
									onPress={() => handleRemoveWindow(window.key)}
								>
									<MaterialCommunityIcons
										name="close-circle-outline"
										size={theme.space.iconSize}
										color={theme.colors.textMuted}
									/>
								</TouchableOpacity>
							</View>
						))}
					</View>
				)}
			</View>

			<View>
				<SectionTitle text={t('schedules.addWindow')} />
				{stationOptions.length === 0 ? (
					<Text style={{ color: theme.colors.textSecondary }}>
						{t('schedules.waitingForStations')}
					</Text>
				) : (
					<View style={{ gap: theme.space.md }}>
						<Picker
							label={t('schedules.station')}
							modifier={['full', 'tall', 'outlined']}
							placeholder={t('schedules.selectStation')}
							options={stationOptions}
							selectedValue={stationId}
							onValueChange={setStationId}
						/>

						<Picker
							label={t('schedules.starts')}
							modifier={['full', 'tall', 'outlined']}
							options={[
								{ label: t('schedules.fixedTime'), value: 'FIXED' },
								{
									label: t('schedules.relativeToAnotherStation'),
									value: 'RELATIVE',
								},
							]}
							selectedValue={startType}
							onValueChange={(value) =>
								setStartType(value as TimeWindowStartType)
							}
						/>

						{startType === 'FIXED' ? (
							<View style={{ flexDirection: 'row', gap: theme.space.sm }}>
								<View style={{ flex: 1 }}>
									<Picker
										label={t('schedules.hour')}
										options={HOURS}
										selectedValue={hour}
										onValueChange={setHour}
										modifier={['full', 'tall', 'outlined']}
									/>
								</View>
								<View style={{ flex: 1 }}>
									<Picker
										label={t('schedules.minute')}
										options={MINUTES}
										selectedValue={minute}
										onValueChange={setMinute}
										modifier={['full', 'tall', 'outlined']}
									/>
								</View>
							</View>
						) : (
							<>
								<Picker
									label={t('schedules.linkedStation')}
									modifier={['full', 'tall', 'outlined']}
									placeholder={t('schedules.selectReferenceStation')}
									options={linkedStationOptions}
									selectedValue={linkedPin}
									onValueChange={setLinkedPin}
									disabled={linkedStationOptions.length === 0}
									onDisabledPress={() =>
										Burnt.toast({
											title: t('schedules.pickExistingReference'),
											preset: 'error',
										})
									}
								/>
								<Picker
									label={t('schedules.relativeTo')}
									modifier={['full', 'tall', 'outlined']}
									options={[
										{
											label: t('schedules.startOfWindow'),
											value: 'START',
										},
										{
											label: t('schedules.endOfWindow'),
											value: 'END',
										},
									]}
									selectedValue={reference}
									onValueChange={(value) =>
										setReference(value as LinkedReferencePoint)
									}
								/>
								<Input
									label={t('schedules.offset')}
									labelBackground={theme.colors.surface}
									value={offsetMinutes}
									onChangeText={setOffsetMinutes}
									keyboardType="numbers-and-punctuation"
									modifier={['tall']}
								/>
							</>
						)}

						<Input
							label={t('schedules.duration')}
							labelBackground={theme.colors.surface}
							value={durationMinutes}
							onChangeText={setDurationMinutes}
							keyboardType="number-pad"
							modifier={['tall']}
						/>

						<Button
							label={t('schedules.addWindow')}
							modifier={['full', 'tall']}
							onPress={handleAddWindow}
						/>
					</View>
				)}
			</View>

			<View>
				<Button
					label={
						mutation.isPending
							? t('schedules.saving')
							: t('schedules.createSchedule')
					}
					modifier={['full', 'tall']}
					disabled={windows.length === 0}
					loading={mutation.isPending}
					onPress={handleSave}
				/>
			</View>
			{editDate && (
				<Button
					label={t('schedules.deleteSchedule')}
					variant="destructive"
					modifier={['full', 'tall']}
					icon="delete-outline"
					disabled={mutation.isPending || deleteMutation.isPending}
					loading={deleteMutation.isPending}
					onPress={handleDelete}
				/>
			)}
		</KeyboardAwareScrollView>
	)
}
