import React, { createContext, useContext, useState } from 'react'

const themeTokens = {
	colors: {
		light: {
			background: '#f6f8fb',
			card: '#ffffff',
			modal: '#ffffff',
			scrim: 'rgba(0,0,0,0.5)',
			textPrimary: '#203247',
			textSecondary: '#4d5a66',
			textMuted: '#8a97a8',
			inputBackground: '#f5f7fa',
			border: '#e7ecf2',
			accent: '#4a6a8a',
			accentTint: '#eef2f7',
			gradientStart: '#f4f6f9',
			gradientEnd: '#eef1fb',
			buttonPrimary: '#1b2a3b',
			buttonPrimaryText: '#ffffff',
			buttonSecondary: '#dfe4ea',
			buttonSecondaryText: '#1b2a3b',
			buttonSecondaryBorder: '#d7dee5',
			buttonDestructive: '#c44f3f',
			buttonDisabled: '#edf1f5',
			buttonDisabledText: '#8a97a8',

			cardPressed: '#f0f3f7',
			buttonPrimaryPressed: '#141f2b',
			buttonSecondaryPressed: '#c4cad1',
			buttonTertiaryPressed: '#eef2f7',
			buttonDestructivePressed: '#a83d2f',

			running: '#5169ac',
			online: '#1e6b35',
			success: '#1e6b35',
			warning: '#a16a1c',
			fault: '#ad3b2c',
			offline: '#5d6b7c',
			scheduled: '#2F5B8A',
			scheduleActive: '#1e4a6f',

			runningBg: '#eff6ff',
			onlineBg: '#E8F5EC',
			successBg: '#E8F5EC',
			warningBg: '#FFF6E8',
			faultBg: '#f7f3f3',
			offlineBg: '#F3F5F8',
			scheduledBg: '#EEF2F7',
			scheduleActiveBg: '#E1ECF6',

			runningBorder: '#D7DEE5',
			onlineBorder: '#CDE9D6',
			successBorder: '#CDE9D6',
			warningBorder: '#F4E3C8',
			faultBorder: '#F1D5D2',
			offlineBorder: '#DDE2E8',
			scheduledBorder: '#D7DEE5',
			scheduleActiveBorder: '#B9D1E6',
		},

		dark: {
			background: '#0f1115',
			card: '#1a1e26',
			modal: '#1a1e26',
			scrim: 'rgba(0,0,0,0.7)',
			textPrimary: '#f8fafc',
			textSecondary: '#94a3b8',
			textMuted: '#64748b',
			inputBackground: '#1e2430',
			border: '#2a3342',
			accent: '#60a5fa',
			accentTint: '#1e293b',
			gradientStart: '#1a1e26',
			gradientEnd: '#0f1115',
			buttonPrimary: '#ffffff',
			buttonPrimaryText: '#1b2a3b',
			buttonSecondary: '#2c323f',
			buttonSecondaryText: '#ffffff',
			buttonSecondaryBorder: '#3d4656',
			buttonDestructive: '#e55353',
			buttonDisabled: '#2c323f',
			buttonDisabledText: '#64748b',

			cardPressed: '#222731',
			buttonPrimaryPressed: '#e2e8f0',
			buttonSecondaryPressed: '#363d4a',
			buttonTertiaryPressed: '#1e293b',
			buttonDestructivePressed: '#d94f4f',

			running: '#6c82c7',
			online: '#4ade80',
			success: '#4ade80',
			warning: '#fbbf24',
			fault: '#f87171',
			offline: '#94A3B8',
			scheduled: '#38bdf8',
			scheduleActive: '#7dd3fc',

			runningBg: 'rgba(108, 130, 199, 0.15)',
			onlineBg: 'rgba(74, 222, 128, 0.15)',
			successBg: 'rgba(74, 222, 128, 0.15)',
			warningBg: 'rgba(251, 191, 36, 0.15)',
			faultBg: 'rgba(248, 113, 113, 0.15)',
			offlineBg: 'rgba(148, 163, 184, 0.15)',
			scheduledBg: 'rgba(56, 189, 248, 0.15)',
			scheduleActiveBg: 'rgba(56, 189, 248, 0.22)',

			runningBorder: 'rgba(108, 130, 199, 0.3)',
			onlineBorder: 'rgba(74, 222, 128, 0.3)',
			successBorder: 'rgba(74, 222, 128, 0.3)',
			warningBorder: 'rgba(251, 191, 36, 0.3)',
			faultBorder: 'rgba(248, 113, 113, 0.3)',
			offlineBorder: 'rgba(148, 163, 184, 0.3)',
			scheduledBorder: 'rgba(56, 189, 248, 0.3)',
			scheduleActiveBorder: 'rgba(56, 189, 248, 0.45)',
		},
	},

	space: {
		x3s: 2,
		x2s: 4,
		xs: 6,
		sm: 8,
		base: 10,
		md: 12,
		lg: 14,
		xl: 16,
		x2l: 24,
		x3l: 32,
		x4l: 40,
		iconSize: 22,
		iconSizeSm: 14,
		iconSizeLg: 26,
		iconSizeXl: 36,
		buttonSize: 50,
		iconOnlyButtonSize: 46,
		tallButtonSize: 62,
		smallButtonSize: 38,
		fabButtonSize: 56,
		buttonHorizontalPadding: 18,
		smallButtonHorizontalPadding: 12,
		smallButtonVerticalPadding: 8,
		buttonVerticalPadding: 12,
		tallButtonHorizontalPadding: 20,
		tallButtonVerticalPadding: 16,
		stickyBarHeight: 90,
	},

	radius: {
		card: 18,
		boxInCard: 8,
		dropdown: 6,
		fab: 18,
		headingIcon: 12,
		badge: 6,
		button: 8,
		pill: 9999,
		input: 8,
	},

	font: {
		xs: 12,
		sm: 14,
		base: 16,
		md: 18,
		lg: 24,
		xl: 28,
	},

	lineHeight: {
		cardTextTitle: 20,
		cardTextSubtitle: 18,
		paragraph: 22,
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
