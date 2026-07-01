import React, { createContext, useContext, useState } from 'react'

const themeTokens = {
	colors: {
		light: {
			background: '#f6f8fb',
			card: '#ffffff',
			modal: '#ffffff',
			textPrimary: '#1b2a3b',
			textSecondary: '#4d5a66',
			textMuted: '#8a97a8',
			border: '#d7dee5',
			accentBlue: '#4a6a8a',
			accentBlueLight: '#eef2f7',
			gradientStart: '#f4f6f9',
			gradientEnd: '#eef1fb',
			buttonPrimaryBg: '#1b2a3b',
			buttonPrimaryText: '#ffffff',
			buttonSecondaryBg: '#edf1f5',
			buttonSecondaryText: '#1b2a3b',
			buttonSecondaryBorder: '#d7dee5',
			buttonDestructiveBg: '#c44f3f',
			buttonDisabledBg: '#edf1f5',
			buttonDisabledText: '#8a97a8',

			// status
			online: '#3a8f55',
			success: '#3a8f55',
			warning: '#c58a2a',
			fault: '#c44f3f',
			offline: '#8a97a8',
			scheduled: '#1b2a3b',

			// status backgrounds
			onlineBg: '#eaf6ef',
			warningBg: '#faf3e6',
			faultBg: '#f8eceb',
			scheduledBg: '#e9edf3',
		},
		dark: {
			background: '#121212',
			card: '#1e1e1e',
			modal: '#1e1e1e',
			textPrimary: '#ffffff',
			textSecondary: '#a0a0a0',
			textMuted: '#666666',
			border: '#333333',
			accentBlue: '#4a6a8a',
			accentBlueLight: '#1a2430',
			gradientStart: '#1e1e1e',
			gradientEnd: '#121212',
			buttonPrimaryBg: '#ffffff',
			buttonPrimaryText: '#1b2a3b',
			buttonSecondaryBg: '#2c323f',
			buttonSecondaryText: '#ffffff',
			buttonSecondaryBorder: '#3d4656',
			buttonDestructiveBg: '#e55353',
			buttonDisabledBg: '#2c323f',
			buttonDisabledText: '#64748b',
			modalBackground: 'rgba(0,0,0,0.7)',

			// status
			online: '#3a8f55',
			success: '#3a8f55',
			warning: '#c58a2a',
			fault: '#c44f3f',
			offline: '#8a97a8',
			scheduled: '#1b2a3b',

			// status backgrounds
			onlineBg: '#eaf6ef',
			warningBg: '#faf3e6',
			faultBg: '#f8eceb',
			scheduledBg: '#e9edf3',
		},
	},

	space: {
		xs: 6,
		sm: 8,
		md: 12,
		lg: 14,
		xl: 20,
		x2l: 30,
		x3l: 32,
	},

	radius: {
		card: 14,
		button: 6,
		fab: 10,
		input: 6,
	},

	font: {
		xs: 13,
		sm: 16,
		base: 18,
		lg: 30,
		xl: 42,
	},

	lineHeight: {
		paragraph: 24,
	},
} as const

type ThemeMode = 'light' | 'dark'

type ThemeColors = Record<keyof typeof themeTokens.colors.light, string>

interface ThemeContextType {
	mode: ThemeMode
	setMode: (mode: ThemeMode) => void
	colors: ThemeColors
	space: typeof themeTokens.space
	radius: typeof themeTokens.radius
	font: typeof themeTokens.font
	lineHeight: typeof themeTokens.lineHeight
}

export const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [mode, setMode] = useState<ThemeMode>('light')

	const value: ThemeContextType = {
		mode,
		setMode,
		colors: themeTokens.colors[mode],
		space: themeTokens.space,
		radius: themeTokens.radius,
		font: themeTokens.font,
		lineHeight: themeTokens.lineHeight,
	}

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}
	return context
}
