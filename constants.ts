export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
export const errorCodes = {
	// Auth / credentials
	BAD_CREDENTIALS: 'BAD_CREDENTIALS',
	NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
	ACCESS_DENIED: 'ACCESS_DENIED',

	// Users
	USERNAME_TAKEN: 'USERNAME_TAKEN',

	// Tokens (JWT + verification/recovery tokens)
	TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
	TOKEN_EXPIRED: 'TOKEN_EXPIRED',
	TOKEN_CREATION_FAILED: 'TOKEN_CREATION_FAILED',
	TOKEN_INVALID: 'TOKEN_INVALID',
	RECOVERY_TOKEN_NOT_FOUND: 'RECOVERY_TOKEN_NOT_FOUND',
	RECOVERY_TOKEN_MISMATCH: 'RECOVERY_TOKEN_MISMATCH',

	// Devices
	DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
	DEVICE_LINK_FAILED: 'DEVICE_LINK_FAILED',
	DEVICE_FETCH_FAILED: 'DEVICE_FETCH_FAILED',
	DUPLICATE_MAC_ADDRESS: 'DUPLICATE_MAC_ADDRESS',

	// Validation
	VALIDATION_FAILED: 'VALIDATION_FAILED',

	// MQTT
	MQTT_ERROR: 'MQTT_ERROR',

	// Others
	NETWORK_ERROR: 'NETWORK_ERROR',
	UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes]

export const tokenTypes = {
	AUTH_ACCESS_TOKEN: 'AUTH_ACCESS_TOKEN',
	AUTH_REFRESH_TOKEN: 'AUTH_REFRESH_TOKEN',
	AUTH_RECOVERY_CODE: 'AUTH_RECOVERY_CODE',
} as const

export type TokenType = (typeof tokenTypes)[keyof typeof tokenTypes]

export const tanstackKeys = {
	REGISTER: ['register'] as const,
	SIGN_IN: ['signin'] as const,
	PROFILE: ['profile'] as const,
	AREAS: ['areas'] as const,
	VALID_EMAIL_USERNAME: ['validEmailUsername'] as const,
	AREA_LINK: ['linkArea'] as const,
	PROFILE_UPDATE: ['profileUpdate'] as const,
	AREA_UPDATE: ['areaUpdate'] as const,
	EMAIL_UPDATE: ['emailUpdate'] as const,
	PASSWORD_UPDATE: ['passwordUpdate'] as const,
} as const

export type TanstackKey = (typeof tanstackKeys)[keyof typeof tanstackKeys]
