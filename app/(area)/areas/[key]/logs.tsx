import { useCallback, useMemo, useRef, useState } from 'react'
import {
	ScrollView as RNScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { useTheme } from '@/context/ThemeContext'
import { useLogStore } from '@/stores/logStore'

const LEVELS = ['debug', 'info', 'warning', 'error', 'critical'] as const
type LogLevel = (typeof LEVELS)[number]

const LEVEL_LABELS: Record<LogLevel, string> = {
	debug: 'DEBUG',
	info: 'INFO',
	warning: 'WARN',
	error: 'ERROR',
	critical: 'CRIT',
}

type FilterOption = 'all' | LogLevel

function getLogLevel(payload: string): LogLevel | undefined {
	const match = payload.match(/\[(DEBUG|INFO|WARNING|ERROR|CRITICAL)\]/)
	return match?.[1]?.toLowerCase() as LogLevel | undefined
}

function levelIndex(level: LogLevel | undefined): number {
	return level ? LEVELS.indexOf(level) : 0
}

export default function AreaLogs() {
	const theme = useTheme()
	const { key } = useLocalSearchParams() as { key: string }
	const logs = useLogStore((state) => state.getLogs(key))
	const [filter, setFilter] = useState<FilterOption>('all')
	const scrollRef = useRef<RNScrollView>(null)
	const isAtBottomRef = useRef(true)

	const visibleLogs = useMemo(() => {
		if (filter === 'all') return logs
		const minIdx = LEVELS.indexOf(filter)
		return logs.filter((log) => levelIndex(getLogLevel(log.payload)) >= minIdx)
	}, [logs, filter])

	const handleScroll: React.ComponentProps<typeof RNScrollView>['onScroll'] =
		useCallback((event) => {
			const { contentOffset, contentSize, layoutMeasurement } =
				event.nativeEvent
			isAtBottomRef.current =
				contentSize.height - contentOffset.y - layoutMeasurement.height < 20
		}, [])

	const handleContentSizeChange = useCallback(() => {
		if (isAtBottomRef.current) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollToEnd({ animated: false })
			})
		}
	}, [])

	return (
		<View style={{ flex: 1, backgroundColor: theme.terminal.bg }}>
			{/* Level filter chips */}
			<View
				style={{
					flexDirection: 'row',
					gap: theme.space.xs,
					paddingTop: theme.space.xs,
					paddingBottom: theme.space.xs,
					paddingHorizontal: theme.space.sm,
					backgroundColor: theme.terminal.bg,
				}}
			>
				{(['all', ...LEVELS] as FilterOption[]).map((option) => {
					const selected = filter === option
					const colorKey: keyof typeof theme.terminal =
						option === 'all' ? 'text' : option
					const color = theme.terminal[colorKey]
					const label = option === 'all' ? 'ALL' : LEVEL_LABELS[option]

					return (
						<TouchableOpacity
							key={option}
							onPress={() => setFilter(option)}
							style={{
								paddingHorizontal: theme.space.sm,
								paddingVertical: theme.space.x2s,
								borderRadius: theme.radius.pill,
								backgroundColor: selected ? color : 'transparent',
								borderWidth: 1,
								borderColor: color,
							}}
						>
							<Text
								style={{
									fontFamily: 'monospace',
									fontSize: theme.font.xs,
									lineHeight: theme.font.xs * 1.2,
									color: selected ? theme.terminal.bg : color,
								}}
							>
								{label}
							</Text>
						</TouchableOpacity>
					)
				})}
			</View>

			{/* Log terminal */}
			<RNScrollView
				ref={scrollRef}
				onScroll={handleScroll}
				onContentSizeChange={handleContentSizeChange}
				scrollEventThrottle={16}
				contentContainerStyle={{
					paddingHorizontal: theme.space.md,
					paddingTop: theme.space.x2s,
					paddingBottom: theme.space.x3l,
					gap: theme.space.x2s,
				}}
			>
				{visibleLogs.length === 0 ? (
					<Text
						style={{
							fontFamily: 'monospace',
							fontSize: theme.font.xs,
							color: theme.terminal.muted,
						}}
					>
						{logs.length === 0 ? 'Waiting for MQTT logs…' : 'No matching logs'}
					</Text>
				) : (
					visibleLogs.map((log) => {
						const level = getLogLevel(log.payload)
						return (
							<Text
								key={log.id}
								style={{
									fontFamily: 'monospace',
									fontSize: theme.font.xs,
									color: level ? theme.terminal[level] : theme.terminal.text,
									lineHeight: theme.lineHeight.cardTextSubtitle,
								}}
							>
								{log.payload}
							</Text>
						)
					})
				)}
			</RNScrollView>
		</View>
	)
}
