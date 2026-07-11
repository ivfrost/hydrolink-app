module.exports = {
	semi: false,
	printWidth: 80,
	tabWidth: 2,
	useTabs: true,
	singleQuote: true,
	plugins: ['@trivago/prettier-plugin-sort-imports'],
	// Keeps a blank line between different import groups
	importOrderSeparation: true,
	// Automatically moves matching imports into their own blocks
	importOrder: ['^react', '<THIRD_PARTY_MODULES>', '^@/(.*)$', '^[./]'],
}
