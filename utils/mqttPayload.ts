/**
 * Convert an incoming MQTT payload into clean text.
 *
 * mqtt.js delivers Buffers, but brokers/servers sometimes publish with a
 * UTF-8 BOM, trailing null bytes, or CRLF framing — all invisible in logs,
 * yet enough to make JSON.parse() throw on otherwise-valid JSON.
 *
 * Only payloads that actually start with `{` or `[` are treated as JSON: for
 * those, the JSON substring (first `{`/`[` to last `}`/`]`) is extracted so
 * any surrounding junk is dropped. Plain-text payloads — e.g. the ESP's
 * device log lines like `2026-08-12 13:33:09 [DEBUG] ACTIONS: ...` — contain
 * brackets too, but must pass through untouched (extracting from the first
 * bracket would otherwise truncate them to just `[DEBUG]`).
 */
export function normalizeMqttPayload(payload: unknown): string {
	let text: string
	if (typeof payload === 'string') {
		text = payload
	} else if (payload instanceof Uint8Array) {
		// Buffers are Uint8Array subclasses.
		text = payload.toString()
	} else {
		try {
			text = JSON.stringify(payload) ?? ''
		} catch {
			return ''
		}
	}

	// Strip a UTF-8 BOM, trailing null bytes, and surrounding whitespace first
	// so the payload is clean regardless of whether it's JSON or plain text.
	const cleaned = text
		.replace(/^\uFEFF/, '')
		.replace(/[\u0000]+$/, '')
		.trim()

	// Only extract the JSON substring when the payload actually starts with
	// `{` or `[`. Plain-text log lines pass through untouched.
	if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
		const start = cleaned.search(/[\[{]/)
		const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'))
		if (start >= 0 && end > start) {
			return cleaned.slice(start, end + 1).trim()
		}
	}

	return cleaned
}
