const theme = {
	// neutrals
	background: '#f6f8fb',
	inputBackground: '#ffffff',
	card: '#ffffff',
	modalBackground: '#ffffff',
	surface: '#edf1f5',
	border: '#d7dee5',
	borderActive: '#4a6a8a',

	// text
	textPrimary: '#1b2a3b',
	textSecondary: '#4d5a66',
	textMuted: '#8a97a8',
	textOnDark: '#ffffff',
	textOnLight: '#1b2a3b',

	fontExtraLarge: 42,
	fontLarge: 30,
	fontBase: 18,
	fontSmall: 16,

	// header
	headerBackground: '#ffffff',
	headerHeight: 40,

	// accent
	accent: '#1b2a3b',
	accentLight: '#32465a',
	accentBlue: '#4a6a8a',
	accentBlueLight: '#eef2f7',

	// buttons
	buttonPrimaryBg: '#1b2a3b',
	buttonPrimaryText: '#ffffff',

	buttonSecondaryBg: '#edf1f5',
	buttonSecondaryText: '#1b2a3b',
	buttonSecondaryBorder: '#d7dee5',

	buttonTertiaryText: '#4d5a66',

	// sizing
	inputBorderRadius: 6,
	buttonBorderRadius: 6,
	themeFabRadius: 12,
	cardBorderRadius: 18,

	// status
	online: '#3a8f55',
	warning: '#c58a2a',
	fault: '#c44f3f',
	offline: '#8a97a8',
	scheduled: '#1b2a3b',

	// status backgrounds
	onlineBg: '#eaf6ef',
	warningBg: '#faf3e6',
	faultBg: '#f8eceb',
	scheduledBg: '#e9edf3',

	// illustrations
	illustrationPrimary: '#4a6a8a',
	illustrationDark: '#1b2a3b',
	illustrationLight: '#bcc7d4',
} as const

interface ThemeProps {
	variant?: 'light' | 'dark'
}

export function useTheme({ variant = 'light' }: ThemeProps = {}) {
	// TODO: add dark theme
	return theme
}
