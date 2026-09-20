import { t } from '@/i18n'

function format(template: string, values: Record<string, number>) {
	return template.replace(/\{(\w+)\}/g, (_, key: string) =>
		String(values[key] ?? `{${key}}`),
	)
}

export function formatRelativeFromEpochStr(isoString: string) {
	const safeTime = isNaN(Number(new Date(isoString)))
		? 0
		: Number(new Date(isoString))
	const diffMinutes = Math.floor((Date.now() - safeTime) / 60000)
	const isFuture = diffMinutes < 0
	const totalMinutes = Math.abs(diffMinutes)

	if (!isFuture && totalMinutes < 1) return t('relative.justNow')

	const days = Math.floor(totalMinutes / 1440)
	const hours = Math.floor((totalMinutes % 1440) / 60)
	const minutes = totalMinutes % 60

	if (days > 0) {
		return isFuture
			? hours > 0
				? format(t('relative.inDays'), { days, hours })
				: format(t('relative.inDaysOnly'), { days })
			: hours > 0
				? format(t('relative.agoDays'), { days, hours })
				: format(t('relative.agoDaysOnly'), { days })
	} else if (hours > 0) {
		return isFuture
			? format(t('relative.inHours'), { hours, minutes })
			: minutes > 0
				? format(t('relative.agoHours'), { hours, minutes })
				: format(t('relative.agoHoursOnly'), { hours })
	} else {
		return isFuture
			? format(t('relative.inMinutes'), { value: minutes })
			: format(t('relative.agoMinutes'), { value: minutes })
	}
}

export function isRelativeTimeInFuture(isoString: string) {
	const safeTime = isNaN(Number(new Date(isoString)))
		? 0
		: Number(new Date(isoString))
	return safeTime > Date.now()
}
