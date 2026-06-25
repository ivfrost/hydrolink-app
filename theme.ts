const theme = {
	// surfaces
	background: '#f4f6f9',
	card: '#ffffff',
	surface: '#eaeef4', // inputs, pressed states
	border: '#dde2ea',

	// text
	textPrimary: '#0f1c2b',
	textSecondary: '#4a5a6e',
	textMuted: '#8a97a8',

	// accent (deep navy)
	accent: '#1b2a3b',

	// status
	online: '#16a34a',
	warning: '#d97706',
	fault: '#dc2626',
	offline: '#8a97a8',
	scheduled: '#4f6af0',

	// status backgrounds (for pills/banners)
	onlineBg: '#e8f8ef',
	warningBg: '#fff8e6',
	faultBg: '#fef0f0',
	scheduledBg: '#eff2ff',
} as const

interface ThemeProps {
	variant?: 'light' | 'dark'
}

export function useTheme({ variant = 'light' }: ThemeProps = {}) {
	// TODO: add dark theme
	return theme
}
