import { useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'

import { useTheme } from '@/context/ThemeContext'
import { t } from '@/i18n'

function getGreeting() {
	const hour = new Date().getHours()
	if (hour < 12) return t('dashboard.goodMorning')
	if (hour < 19) return t('dashboard.goodAfternoon')
	return t('dashboard.goodEvening')
}

function getWeatherIcon(
	code: number,
): keyof typeof MaterialCommunityIcons.glyphMap {
	if ([0].includes(code)) return 'weather-sunny'
	if ([1, 2].includes(code)) return 'weather-partly-cloudy'
	if ([3, 45, 48].includes(code)) return 'weather-cloudy'
	if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) {
		return 'weather-pouring'
	}
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'weather-snowy'
	if ([95, 96, 99].includes(code)) return 'weather-lightning-rainy'
	return 'help-circle-outline'
}

type WeatherTone = 'accent' | 'textMuted' | 'warning' | 'scheduled' | 'fault'

type WeatherCoordinates = Pick<
	Location.LocationObjectCoords,
	'latitude' | 'longitude'
>

function getWeatherTone(code: number): WeatherTone {
	if ([0, 1, 2].includes(code)) return 'warning'
	if ([3, 45, 48].includes(code)) return 'textMuted'
	if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) {
		return 'accent'
	}
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'scheduled'
	if ([95, 96, 99].includes(code)) return 'fault'
	return 'textMuted'
}

function getWeatherImageUrl(code: number, isDay: boolean) {
	const suffix = isDay ? 'd' : 'n'
	let iconCode = '01'
	if ([1, 2].includes(code)) iconCode = '02'
	if (code === 3) iconCode = '03'
	if ([45, 48].includes(code)) iconCode = '50'
	if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) {
		iconCode = '10'
	}
	if ([71, 73, 75, 77, 85, 86].includes(code)) iconCode = '13'
	if ([95, 96, 99].includes(code)) iconCode = '11'
	return `https://openweathermap.org/img/wn/${iconCode}${suffix}@2x.png`
}

async function fetchWeatherPresentation(requestPermission: boolean) {
	const permission = requestPermission
		? await Location.requestForegroundPermissionsAsync()
		: await Location.getForegroundPermissionsAsync()
	if (permission.status !== 'granted') return null

	let coords: WeatherCoordinates | null = null
	let locationLabel: string | undefined
	try {
		coords = (
			await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			})
		).coords
	} catch {
		try {
			const lastKnown = await Location.getLastKnownPositionAsync()
			coords = lastKnown?.coords ?? null
		} catch {
			coords = null
		}
	}

	if (!coords) {
		try {
			const response = await fetch('https://ipwho.is/')
			if (response.ok) {
				const data = (await response.json()) as {
					success?: boolean
					latitude?: number
					longitude?: number
					city?: string
					region?: string
				}
				if (
					data.success !== false &&
					typeof data.latitude === 'number' &&
					typeof data.longitude === 'number'
				) {
					coords = {
						latitude: data.latitude,
						longitude: data.longitude,
					}
					locationLabel = [data.city, data.region].filter(Boolean).join(', ')
				}
			}
		} catch {
			return null
		}
	}

	if (!coords) return null

	if (!locationLabel) {
		try {
			const places = await Location.reverseGeocodeAsync(coords)
			const place = places[0]
			locationLabel = [place?.city, place?.region].filter(Boolean).join(', ')
		} catch {
			locationLabel = undefined
		}
	}

	const response = await fetch(
		`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=weather_code,is_day&timezone=auto`,
	)
	if (!response.ok) return null

	const data = (await response.json()) as {
		current?: { weather_code?: number; is_day?: number }
	}
	const weatherCode = data.current?.weather_code
	if (typeof weatherCode !== 'number') return null

	return {
		icon: getWeatherIcon(weatherCode),
		tone: getWeatherTone(weatherCode),
		imageUrl: getWeatherImageUrl(weatherCode, data.current?.is_day !== 0),
		locationLabel,
	}
}

export interface DashboardHeaderProps {
	name?: string
	weatherRefreshKey?: number
}

export default function DashboardHeader({
	name,
	weatherRefreshKey = 0,
}: DashboardHeaderProps) {
	const theme = useTheme()
	const badgeSize = theme.space.x3l + 16
	const [weatherIcon, setWeatherIcon] = useState<
		keyof typeof MaterialCommunityIcons.glyphMap
	>(() => 'help-circle-outline')
	const [weatherImageUrl, setWeatherImageUrl] = useState<string | null>(null)
	const [weatherTone, setWeatherTone] = useState<WeatherTone>('textMuted')
	const [locationLabel, setLocationLabel] = useState('')
	const [isWeatherLoading, setIsWeatherLoading] = useState(false)

	const refreshWeather = async (requestPermission: boolean) => {
		setIsWeatherLoading(true)
		try {
			const presentation = await fetchWeatherPresentation(requestPermission)
			if (presentation) {
				setWeatherIcon(presentation.icon)
				setWeatherTone(presentation.tone)
				setWeatherImageUrl(presentation.imageUrl)
				setLocationLabel(presentation.locationLabel ?? '')
			}
		} catch {
			// Keep the neutral fallback when location or weather is unavailable.
		} finally {
			setIsWeatherLoading(false)
		}
	}

	useEffect(() => {
		let cancelled = false

		void fetchWeatherPresentation(true)
			.then((presentation) => {
				if (!cancelled && presentation) {
					setWeatherIcon(presentation.icon)
					setWeatherTone(presentation.tone)
					setWeatherImageUrl(presentation.imageUrl)
					setLocationLabel(presentation.locationLabel ?? '')
				}
			})
			.catch(() => {
				// Weather is optional; keep the neutral fallback when unavailable.
			})
		return () => {
			cancelled = true
		}
	}, [weatherRefreshKey])

	return (
		<LinearGradient
			colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{
				paddingHorizontal: theme.space.xl,
				paddingVertical: theme.space.x2l,
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<View style={{ flex: 1, paddingRight: theme.space.md }}>
				<Text
					style={{
						fontSize: theme.font.md,
						fontWeight: theme.fontWeight.semibold,
						color: theme.colors.textPrimary,
						flexShrink: 1,
					}}
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{getGreeting()}
					{name ? `, ${name}` : ''}
				</Text>
				<Text
					style={{
						fontSize: theme.font.sm,
						color: theme.colors.textSecondary,
						marginTop: theme.space.x2s,
						lineHeight: theme.lineHeight.paragraph,
					}}
				>
					{t('dashboard.areasDoingToday')}
				</Text>
				{locationLabel ? (
					<Text
						style={{
							color: theme.colors.textMuted,
							fontSize: theme.font.xs,
							marginTop: theme.space.x2s,
						}}
					>
						{t('dashboard.near')} {locationLabel}
					</Text>
				) : null}
			</View>
			<TouchableOpacity
				onPress={() => void refreshWeather(true)}
				activeOpacity={0.75}
				accessibilityRole="button"
				accessibilityLabel={t('dashboard.refreshWeather')}
				accessibilityHint={t('dashboard.refreshWeatherHint')}
				style={{
					width: badgeSize,
					height: badgeSize,
					borderRadius: badgeSize / 2,
					backgroundColor: theme.colors.surfaceRaised,
					justifyContent: 'center',
					alignItems: 'center',
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.08,
					shadowRadius: 6,
				}}
			>
				{isWeatherLoading ? (
					<ActivityIndicator size="small" color={theme.colors.textMuted} />
				) : weatherImageUrl ? (
					<Image
						source={{ uri: weatherImageUrl }}
						style={{ width: 44, height: 44 }}
						resizeMode="contain"
					/>
				) : (
					<MaterialCommunityIcons
						name={weatherIcon}
						size={28}
						color={theme.colors[weatherTone]}
					/>
				)}
			</TouchableOpacity>
			<Text
				style={{
					bottom: theme.space.xs,
					color: theme.colors.textMuted,
					fontSize: theme.font.xxs,
					opacity: 0.6,
					position: 'absolute',
					right: theme.space.xl,
					textAlign: 'right',
				}}
			>
				{t('dashboard.weatherVia')}
			</Text>
		</LinearGradient>
	)
}
