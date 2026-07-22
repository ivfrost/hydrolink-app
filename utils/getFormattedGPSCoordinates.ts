import { Alert, Linking, Platform } from 'react-native'
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler'
import Geolocation from 'react-native-geolocation-service'

import * as Burnt from 'burnt'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Location from 'expo-location'

export async function getFormattedGPSCoordinates(): Promise<string | null> {
	// expo-location for cross-platform permission handling
	const { status } = await Location.requestForegroundPermissionsAsync()
	if (status !== 'granted') {
		Burnt.toast({
			title: 'Permission Denied',
			message: 'Location access is required.',
			preset: 'error',
		})
		return null
	}

	// Check if system location services are enabled
	let isServicesEnabled = await Location.hasServicesEnabledAsync()

	if (Platform.OS === 'android' && !isServicesEnabled) {
		try {
			// Try the native Google Play Services "enable location" dialog first.
			// Race against a timeout since this can hang silently on devices
			// without a working SettingsClient (e.g. de-Googled / no-GMS devices).
			await Promise.race([
				promptForEnableLocationIfNeeded({
					interval: 10000,
					waitForAccurate: false,
				}),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('ENABLER_TIMEOUT')), 8000),
				),
			])
		} catch (e) {
			console.warn('[GPS] enabler prompt error/timeout:', e)
		}

		// Re-check after the prompt closes (accepted, dismissed, or timed out)
		isServicesEnabled = await Location.hasServicesEnabledAsync()

		if (!isServicesEnabled) {
			// Either the user dismissed the GMS dialog, or it never showed at
			// all (no Play Services available) — fall back to system settings.
			Alert.alert(
				'Location Disabled',
				'Please enable Location Services to continue.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Open Settings',
						onPress: () => {
							if (Platform.OS === 'android') {
								// Deep-links straight to the system Location settings
								// screen, rather than this app's settings page.
								IntentLauncher.startActivityAsync(
									IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
								)
							} else {
								// iOS has no direct deep link to a location-specific
								// settings screen — app settings is the closest we get.
								Linking.openSettings()
							}
						},
					},
				],
			)
			return null
		}
	}

	return new Promise((resolve) => {
		// Try High Accuracy (Google Play Services Fused Location) first
		Geolocation.getCurrentPosition(
			(position) => {
				resolve(formatAndToastLocation(position, false))
			},
			(error) => {
				console.warn('High accuracy location failed, falling back:', error)

				// Fallback: Force standard Android OS Location Manager (bypasses Google Play Services)
				Geolocation.getCurrentPosition(
					(fallbackPosition) => {
						resolve(formatAndToastLocation(fallbackPosition, true))
					},
					(fallbackError) => {
						console.error('Fallback location failed:', fallbackError)
						Burnt.toast({
							title: 'Location Unavailable',
							message: 'Unable to retrieve location from hardware.',
							preset: 'error',
						})
						resolve(null)
					},
					{
						// Forces Native Android LocationManager instead of FusedLocationProvider (Google Play Services)
						enableHighAccuracy: false,
						timeout: 15000,
						maximumAge: 10000,
						// For de-Googled Android devices
						forceLocationManager: true,
					},
				)
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 5000,
			},
		)
	})
}

function formatAndToastLocation(
	position: Geolocation.GeoPosition,
	isFallback: boolean,
): string {
	const lat = position.coords.latitude.toFixed(6)
	const lng = position.coords.longitude.toFixed(6)
	const accuracy = position.coords.accuracy
		? Math.round(position.coords.accuracy)
		: null

	Burnt.toast({
		title: isFallback
			? 'GPS Captured (Native Fallback)'
			: 'GPS Location Captured',
		message: accuracy ? `Accuracy: ±${accuracy}m` : 'Location acquired',
		preset: 'done',
	})

	return `${lat}, ${lng}`
}
