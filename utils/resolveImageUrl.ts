export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL

export default function resolveImageUrl(
	path: string | undefined | null,
): string | undefined {
	if (!path) return undefined

	if (
		path.startsWith('http://') ||
		path.startsWith('https://') ||
		path.startsWith('file://') ||
		path.startsWith('data:')
	) {
		return path
	}

	const baseUrl = API_BASE_URL?.replace(/\/+$/, '') ?? ''
	const cleanKey = path.replace(/^\/+/, '')

	// Maps "areas/3/xyz.jpeg" -> "http://{baseUrl}/storage/files?key=areas%2F3%2Fxyz.jpeg"
	return `${baseUrl}/storage/files?key=${encodeURIComponent(cleanKey)}`
}
