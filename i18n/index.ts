import { getLocales } from 'expo-localization'

import en from '@/locales/en'
import es from '@/locales/es'

export type Locale = 'en' | 'es'
export type Translations = {
	[Section in keyof typeof en]: {
		[Key in keyof typeof en[Section]]: string
	}
}

const systemLocale = getLocales()[0]?.languageCode ?? 'en'
const locale: Locale = systemLocale.toLowerCase().startsWith('es') ? 'es' : 'en'

export const translations: Translations = locale === 'es' ? es : en
export const currentLocale = locale

export function t<Section extends keyof Translations, Key extends keyof Translations[Section]>(
	key: `${Section & string}.${Key & string}`,
): Translations[Section][Key] {
	const [section, translationKey] = key.split('.') as [Section, Key]
	return translations[section][translationKey]
}
