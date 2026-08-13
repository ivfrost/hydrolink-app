/**
 * Normalize an MQTT payload into clean text: strips a BOM, trailing nulls and
 * whitespace, and extracts the JSON substring only when the payload starts
 * with `{`/`[` (so plain-text ESP log lines aren't truncated).
 */
export function normalizeMqttPayload(payload: unknown): string {
	let text: string
	if (typeof payload === 'string') {
		text = payload
	} else if (payload instanceof Uint8Array) {
		text = payload.toString()
	} else {
		try {
			text = JSON.stringify(payload) ?? ''
		} catch {
			return ''
		}
	}

	const cleaned = text
		.replace(/^\uFEFF/, '')
		.replace(/[\u0000]+$/, '')
		.trim()

	// Only treat it as JSON when it actually starts with `{`/`[`.
	if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
		const start = cleaned.search(/[\[{]/)
		const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'))
		if (start >= 0 && end > start) {
			return cleaned.slice(start, end + 1).trim()
		}
	}

	return cleaned
}
