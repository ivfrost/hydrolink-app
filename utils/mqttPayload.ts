/**
 * Decode an MQTT payload into text. Prefer an explicit UTF-8 decode: the value
 * can be a Uint8Array whose `toString()` does not decode (it comma-joins the
 * bytes), and an MQTT Buffer shim may not default to UTF-8.
 */
function decodePayload(payload: unknown): string {
	if (typeof payload === 'string') return payload

	if (payload instanceof Uint8Array) {
		try {
			return new TextDecoder('utf-8').decode(payload)
		} catch {
			let decoded = ''
			for (const byte of payload) decoded += String.fromCharCode(byte)
			return decoded
		}
	}

	try {
		return JSON.stringify(payload) ?? ''
	} catch {
		return ''
	}
}

/**
 * Normalize an MQTT payload into clean text: strips a BOM, trailing nulls and
 * whitespace, and extracts the JSON substring only when the payload starts
 * with `{`/`[` (so plain-text ESP log lines aren't truncated).
 */
export function normalizeMqttPayload(payload: unknown): string {
	const text = decodePayload(payload)

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

/**
 * Parse an MQTT JSON payload defensively. The ESP can emit raw C0 control bytes
 * inside string values (e.g. a station name or description read from
 * uninitialised EEPROM). Those bytes are invalid JSON and would otherwise drop
 * the entire snapshot, so replace them and retry once.
 */
export function parseMqttJson<T = unknown>(text: string): T {
	const attempts: (() => T)[] = [
		() => JSON.parse(text) as T,
		// The common case: raw C0 bytes inside a string value.
		() => JSON.parse(text.replace(/[\u0000-\u001f]/g, ' ')) as T,
		// Same, but delete them instead of replacing (a space can break a number).
		() => JSON.parse(text.replace(/[\u0000-\u001f]/g, '')) as T,
	]

	let lastError: unknown
	for (const attempt of attempts) {
		try {
			return attempt()
		} catch (error) {
			lastError = error
		}
	}

	console.warn(
		'[mqtt] unparseable payload (escaped):',
		JSON.stringify(text).slice(0, 500),
	)
	throw lastError
}
