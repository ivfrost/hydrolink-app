export function formatRelativeTime(
	isoString: string,
	variant: 'active' | 'incoming',
) {
	const safeTime = isNaN(Number(new Date(isoString)))
		? 0
		: Number(new Date(isoString))
	const diffMinutes = Math.floor((Date.now() - safeTime) / 60000)

	if (variant === 'incoming') {
		const absMinutes = Math.abs(diffMinutes)
		if (absMinutes < 60) return `in ${absMinutes}m`
		return `in ${Math.floor(absMinutes / 60)}h ${absMinutes % 60}m`
	}
	if (diffMinutes < 1) return 'just now'
	if (diffMinutes < 60) return `${diffMinutes}m ago`
	return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`
}
