import { RefreshControl, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useHeaderHeight } from 'expo-router/build/react-navigation'

import { useTheme } from '@/context/ThemeContext'
import { useAreaMqttData } from '@/hooks/useAreaMqttData'
import { t } from '@/i18n'
import { AreaDbData } from '@/types/area'
import { Schedule } from '@/types/schedule'

import ScrollView from '../layout/ScrollView'
import Button from '../ui/Button'
import { Picker } from '../ui/Picker'
import SchedulePreviewCard from './SchedulePreviewCard'

export interface SchedulesTabScreenProps {
	schedules: Schedule[]
	areas: AreaDbData[]
	isRefreshing: boolean
	onRefresh: () => void
	onCreateNewSchedule: () => void
	onEditSchedule: (date: string) => void
	selectedAreaKey: string | null
	onSelectArea: (areaKey: string) => void
}
export default function SchedulesTabScreen({
	schedules,
	areas,
	isRefreshing,
	onRefresh,
	onCreateNewSchedule,
	onEditSchedule,
	selectedAreaKey,
	onSelectArea,
}: SchedulesTabScreenProps) {
	const theme = useTheme()
	const headerHeight = useHeaderHeight()
	const { allStations } = useAreaMqttData(selectedAreaKey ?? undefined)

	// Map a window's pin to the live station name, falling back to an index label.
	const stationName = (pin: number) =>
		allStations.find((station) => station.id === pin)?.name ||
		t('stations.stationFallback').replace('{value}', String(pin + 1))

	return (
		<ScrollView
			fab={
				areas.length > 0 &&
				selectedAreaKey && (
					<Button
						modifier={['fab']}
						icon="add"
						extraStyles={{
							position: 'absolute',
							right: 0,
							bottom: 0,
						}}
						onPress={onCreateNewSchedule}
					/>
				)
			}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					progressViewOffset={headerHeight}
				/>
			}
		>
			{areas.length > 0 && (
				<View style={{ gap: theme.space.xs }}>
					<Text
						style={{
							color: theme.colors.textSecondary,
							fontSize: theme.font.xs,
							fontWeight: theme.fontWeight.semibold,
							paddingHorizontal: theme.space.xs,
						}}
					>
						{t('schedules.area')}
					</Text>
					<Picker
						modifier={['full', 'tall', 'outlined']}
						placeholder={t('schedules.selectArea')}
						options={areas.map((area) => ({
							label: area.friendlyName ?? area.key,
							value: area.key,
						}))}
						selectedValue={selectedAreaKey}
						onValueChange={onSelectArea}
					/>
				</View>
			)}
			{areas.length === 0 ? (
				<View
					style={{
						alignItems: 'center',
						gap: theme.space.sm,
						paddingHorizontal: theme.space.lg,
						paddingVertical: theme.space.xl,
					}}
				>
					<MaterialCommunityIcons
						name="calendar-blank-outline"
						size={theme.space.iconSizeLg}
						color={theme.colors.textMuted}
					/>
					<Text
						style={{
							color: theme.colors.textSecondary,
							textAlign: 'center',
						}}
					>
						{t('schedules.linkAreaHint')}
					</Text>
				</View>
			) : !selectedAreaKey ? (
				<Text
					style={{
						color: theme.colors.textSecondary,
						paddingHorizontal: theme.space.sm,
					}}
				>
					{t('schedules.selectAreaHint')}
				</Text>
			) : null}
			{selectedAreaKey && (
				<View style={{ gap: theme.space.sm }}>
					<Text
						style={{
							color: theme.colors.textPrimary,
							fontSize: theme.font.md,
							fontWeight: theme.fontWeight.semibold,
							paddingHorizontal: theme.space.xs,
						}}
					>
						{t('schedules.schedules')}
					</Text>
					{schedules.length === 0 ? (
						<Text
							style={{
								color: theme.colors.textSecondary,
								paddingHorizontal: theme.space.xs,
								paddingVertical: theme.space.sm,
							}}
						>
							{t('schedules.noSchedulesHint')}
						</Text>
					) : (
						<View style={{ gap: theme.space.xl }}>
							{schedules.map((schedule) => (
								<SchedulePreviewCard
									key={schedule.id}
									schedule={schedule}
									stationName={stationName}
									onPress={() => onEditSchedule(schedule.date)}
								/>
							))}
						</View>
					)}
				</View>
			)}
		</ScrollView>
	)
}
