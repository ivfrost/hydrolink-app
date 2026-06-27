import { createServer } from 'miragejs'
const g = global as any

export function startMockServer() {
	if (g.server) {
		g.server.shutdown()
	}
	g.server = createServer({
		routes() {
			this.get('/api/devices', () => ({}))
		},
	})
}
