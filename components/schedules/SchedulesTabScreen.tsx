import { RefreshControl, Text, View } from 'react-native'

import { useHeaderHeight } from 'expo-router/build/react-navigation'

import { useTheme } from '@/context/ThemeContext'
import { AreaDbData } from '@/types/area'
import { Schedule } from '@/types/schedule'

import ScrollView from '../layout/ScrollView'
import Button from '../ui/Button'
import { Picker } from '../ui/Picker'

export interface SchedulesTabScreenProps {
	schedules: Schedule[]
	areas: AreaDbData[]
	isRefreshing: boolean
	onRefresh: () => void
	onCreateNewSchedule: () => void
	selectedAreaKey: string | null
	onSelectArea: (areaKey: string) => void
}
export default function SchedulesTabScreen({
	schedules,
	areas,
	isRefreshing,
	onRefresh,
	onCreateNewSchedule,
	selectedAreaKey,
	onSelectArea,
}: SchedulesTabScreenProps) {
	const theme = useTheme()
	const headerHeight = useHeaderHeight()

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
				<Picker
					modifier={['full', 'tall', 'outlined']}
					placeholder="Select an area"
					options={areas.map((area) => ({
						label: area.friendlyName ?? area.key,
						value: area.key,
					}))}
					selectedValue={selectedAreaKey}
					onValueChange={onSelectArea}
				/>
			)}
			{areas.length === 0 ? (
				<Text
					style={{
						color: theme.colors.textSecondary,
						paddingHorizontal: theme.space.sm,
					}}
				>
					You don't have any linked areas yet. Link a device from the Areas tab
					to set up schedules.
				</Text>
			) : !selectedAreaKey ? (
				<Text
					style={{
						color: theme.colors.textSecondary,
						paddingHorizontal: theme.space.sm,
					}}
				>
					Please select an area to view its schedules.
				</Text>
			) : null}
			{/* Render schedules list here */}
			{schedules.length === 0 && selectedAreaKey && (
				<Text
					style={{
						color: theme.colors.textSecondary,
						paddingHorizontal: theme.space.sm,
					}}
				>
					No schedules found for this area. Create a new schedule to get
					started.
				</Text>
			)}
			{schedules.map((schedule) => (
				<View
					key={schedule.id}
					style={{
						padding: theme.space.sm,
						borderBottomWidth: 1,
						borderBottomColor: theme.colors.border,
					}}
				>
					<Text style={{ color: theme.colors.textPrimary }}>
						{schedule.id}: {schedule.dayOfWeek}
					</Text>
					{schedule.windows.map((window) => (
						<View key={window.id} style={{ paddingLeft: theme.space.md }}>
							<Text style={{ color: theme.colors.textSecondary }}>
								Window ID: {window.id}, Pin: {window.pin}, Start Type:{' '}
								{window.startType}, Fixed Time: {window.fixedTime}, Linked Pin:{' '}
								{window.linkedPin}, Offset Minutes: {window.offsetMinutes},
								Duration Minutes: {window.durationMinutes}, Has Conflict:{' '}
								{window.hasConflict ? 'Yes' : 'No'}
							</Text>
						</View>
					))}
				</View>
			))}
		</ScrollView>
	)
}
