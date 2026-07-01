// mocks/mqtt.cjs
const { Aedes } = require('aedes')
const net = require('net')
const http = require('http')
const ws = require('websocket-stream')

async function main() {
	const aedes = await Aedes.createBroker()

	// TCP (not used by Expo)
	const tcpServer = net.createServer(aedes.handle)
	tcpServer.listen(1883, () => {
		console.log('TCP MQTT broker on 1883')
	})

	// WebSocket (Expo uses this)
	const httpServer = http.createServer()
	ws.createServer({ server: httpServer }, aedes.handle)
	httpServer.listen(8083, '0.0.0.0', () => {
		console.log('WebSocket MQTT broker on ws://0.0.0.0:8083')
	})

	aedes.on('client', (client) => {
		console.log('Client connected:', client.id)

		aedes.publish({
			topic: 'hydro/1/HYDRO-AE70F/status',
			payload: JSON.stringify({ hello: 'world' }),
			retain: true,
		})
	})
}

main()
