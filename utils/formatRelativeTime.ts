export function formatRelativeTime(isoString: string) {
	const safeTime = isNaN(Number(new Date(isoString)))
		? 0
		: Number(new Date(isoString))
	const diffMinutes = Math.floor((Date.now() - safeTime) / 60000)
	const isFuture = diffMinutes < 0
	const totalMinutes = Math.abs(diffMinutes)

	if (!isFuture && totalMinutes < 1) return 'just now'

	const days = Math.floor(totalMinutes / 1440)
	const hours = Math.floor((totalMinutes % 1440) / 60)
	const minutes = totalMinutes % 60

	let duration: string
	if (days > 0) {
		duration = hours > 0 ? `${days}d ${hours}h` : `${days}d`
	} else if (hours > 0) {
		duration = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
	} else {
		duration = `${minutes}m`
	}

	return isFuture ? `in ${duration}` : `${duration} ago`
}

export function isRelativeTimeInFuture(isoString: string) {
	const safeTime = isNaN(Number(new Date(isoString)))
		? 0
		: Number(new Date(isoString))
	return safeTime > Date.now()
}
