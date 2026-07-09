export const isValidEmailFormat = (value: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
