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
			textBoxBackground: '#f5f7fa',
			border: '#d7dee5',
			accentBlue: '#4a6a8a',
			accentBlueLight: '#eef2f7',
			gradientStart: '#f4f6f9',
			gradientEnd: '#eef1fb',
			buttonPrimaryBg: '#1b2a3b',
			buttonPrimaryText: '#ffffff',
			buttonSecondaryBg: '#dfe4ea',
			buttonSecondaryText: '#1b2a3b',
			buttonSecondaryBorder: '#d7dee5',
			buttonDestructiveBg: '#c44f3f',
			buttonDisabledBg: '#edf1f5',
			buttonDisabledText: '#8a97a8',

			online: '#1e6b35',
			success: '#1e6b35',
			warning: '#a16a1c',
			fault: '#ad3b2c',
			offline: '#5d6b7c',
			scheduled: '#1b2a3b',

			onlineBg: '#eaf6ef',
			warningBg: '#faf3e6',
			faultBg: '#f8eceb',
			scheduledBg: '#e9edf3',

			onlineBorder: '#ccebd8',
			warningBorder: '#f3e3ca',
			faultBorder: '#f0d6d3',
			scheduledBorder: '#d7dee5',
		},
		dark: {
			background: '#0f1115',
			card: '#1a1e26',
			modal: '#1a1e26',
			textPrimary: '#f8fafc',
			textSecondary: '#94a3b8',
			textMuted: '#64748b',
			border: '#2a3342',
			accentBlue: '#60a5fa',
			accentBlueLight: '#1e293b',
			gradientStart: '#1a1e26',
			gradientEnd: '#0f1115',
			buttonPrimaryBg: '#ffffff',
			buttonPrimaryText: '#1b2a3b',
			buttonSecondaryBg: '#2c323f',
			buttonSecondaryText: '#ffffff',
			buttonSecondaryBorder: '#3d4656',
			buttonDestructiveBg: '#e55353',
			buttonDisabledBg: '#2c323f',
			buttonDisabledText: '#64748b',
			modalBackground: 'rgba(0,0,0,0.7)',

			online: '#4ade80',
			success: '#4ade80',
			warning: '#fbbf24',
			fault: '#f87171',
			offline: '#94a3b8',
			scheduled: '#38bdf8',

			onlineBg: 'rgba(74, 222, 128, 0.15)',
			warningBg: 'rgba(251, 191, 36, 0.15)',
			faultBg: 'rgba(248, 113, 113, 0.15)',
			scheduledBg: 'rgba(56, 189, 248, 0.15)',

			onlineBorder: 'rgba(74, 222, 128, 0.3)',
			warningBorder: 'rgba(251, 191, 36, 0.3)',
			faultBorder: 'rgba(248, 113, 113, 0.3)',
			scheduledBorder: 'rgba(56, 189, 248, 0.3)',
		},
	},

	space: {
		x3s: 2,
		x2s: 4,
		xs: 6,
		sm: 8,
		md: 12,
		lg: 14,
		xl: 16,
		xxl: 20,
		x2l: 24,
		x3l: 32,
		xxxl: 40,
	},

	radius: {
		card: 16,
		fab: 12,
		button: 8,
		pill: 9999,
		input: 8,
	},

	font: {
		xs: 12,
		sm: 14,
		base: 16,
		md: 20,
		lg: 24,
		xl: 32,
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
