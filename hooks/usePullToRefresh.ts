import { useCallback, useEffect, useRef, useState } from 'react'

type RefreshTask = () => Promise<void> | void

const REFRESH_TIMEOUT_MS = 15_000

export function usePullToRefresh() {
	const [isRefreshing, setIsRefreshing] = useState(false)
	const isRefreshingRef = useRef(false)
	const isMountedRef = useRef(true)

	useEffect(() => {
		return () => {
			isMountedRef.current = false
		}
	}, [])

	const refresh = useCallback(async (task: RefreshTask) => {
		if (isRefreshingRef.current) return

		isRefreshingRef.current = true
		if (isMountedRef.current) setIsRefreshing(true)

		let timeoutId: ReturnType<typeof setTimeout> | undefined
		try {
			await Promise.race([
				Promise.resolve().then(task),
				new Promise<void>((_, reject) => {
					timeoutId = setTimeout(
						() =>
							reject(
								new Error(
									`Refresh timed out after ${REFRESH_TIMEOUT_MS / 1000} seconds`,
								),
							),
						REFRESH_TIMEOUT_MS,
					)
				}),
			])
		} finally {
			if (timeoutId) clearTimeout(timeoutId)
			isRefreshingRef.current = false
			if (isMountedRef.current) setIsRefreshing(false)
		}
	}, [])

	return { isRefreshing, refresh }
}
