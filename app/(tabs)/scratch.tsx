{
	/* <Button


  	const setTypeForAreaStationMqtt = useMqtt().setTypeForAreaStation
	const setTypeForAreaStationStore = useAreaStore(
		(state) => state.setStationTypeForArea,
	)
							variant="primary"
							label={`${area.name ?? area.key ?? 'Unnamed Area'}: Set Station 1 to Solenoid`}
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => setTypeForAreaStation(area.key, 0, 'Solenoid')}
						/>
						<Button
							variant="primary"
							label={`${area.name ?? area.key ?? 'Unnamed Area'}: Set Station 2 to Solenoid`}
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => setTypeForAreaStation(area.key, 1, 'Solenoid')}
						/>
						<Button
							variant="primary"
							label={`${area.name ?? area.key ?? 'Unnamed Area'}: Set Station 3 to Solenoid`}
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => setTypeForAreaStation(area.key, 2, 'Solenoid')}
						/>
						<Button
							variant="primary"
							label={`${area.name ?? area.key ?? 'Unnamed Area'}: Set Station 4 to Solenoid`}
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => setTypeForAreaStation(area.key, 3, 'Solenoid')}
						/>

						<Button
							variant="primary"
							label="StartAllStations"
							disabled={!isMqttReady || isRefreshing}
							onPress={startAllStations}
						/>
						<Button
							variant="secondary"
							label="StartStation1"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => startStation(0)}
						/>
						<Button
							variant="secondary"
							label="StartStation2"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => startStation(1)}
						/>
						<Button
							variant="secondary"
							label="StartStation3"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => startStation(2)}
						/>
						<Button
							variant="secondary"
							label="StartStation4"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => startStation(3)}
						/>
						<Button
							variant="secondary"
							label="StopStation1"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => stopStation(0)}
						/>
						<Button
							variant="secondary"
							label="StopStation2"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => stopStation(1)}
						/>
						<Button
							variant="secondary"
							label="StopStation3"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => stopStation(2)}
						/>
						<Button
							variant="secondary"
							label="StopStation4"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={() => stopStation(3)}
						/>
						<Button
							variant="destructive"
							label="StopAllStations"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={stopAllStations}
						/>
						<Button
							variant="secondary"
							label="GetAllStatus"
							disabled={!isMqttReady || isRefreshing || !areaData}
							onPress={publishStatusRequests}
						/>


	// DEBUG MQTT commands for testing purposes
	// Publish MQTT status request commands to the allowed topics
	const publishStatusRequests = useCallback(() => {
		console.log('Publishing status requests to topics:', publishableTopics)
		publishableTopics.forEach((topic) => {
			const commandTopic = topic.replace('/#', '/command')

			const statusRequestCommand: MqttCommand = {
				action: 'GetAllStatus',
				// -1 indicates a request for all stations
				stationId: -1,
				cause: 'Manual',
			}
			const message = JSON.stringify(statusRequestCommand)
			console.log(
				'Publishing status request to topic:',
				commandTopic,
				'Message:',
				message,
			)
			publish(commandTopic, message)
		})
	}, [publishableTopics, publish])

	const startStation = useCallback(
		(stationId: number) => {
			console.log('Publishing start command to topics:', publishableTopics)
			publishableTopics.forEach((topic) => {
				const commandTopic = topic.replace('/#', '/command')

				const startCommand: MqttCommand = {
					action: 'Start',
					stationId,
					cause: 'Manual',
				}
				const message = JSON.stringify(startCommand)
				console.log(
					'Publishing start command to topic:',
					commandTopic,
					'Message:',
					message,
				)
				publish(commandTopic, message)
			})
		},
		[publishableTopics, publish],
	)

	const startAllStations = useCallback(() => {
		console.log('Publishing start commands to topics:', publishableTopics)
		publishableTopics.forEach((topic) => {
			const commandTopic = topic.replace('/#', '/command')

			const startCommand = (stationId: number): MqttCommand => ({
				action: 'Start',
				stationId,
				cause: 'Manual',
			})

			for (let stationId = 0; stationId <= 4; stationId++) {
				const message = JSON.stringify(startCommand(stationId))
				console.log(
					'Publishing start command to topic:',
					commandTopic,
					'Message:',
					message,
				)
				publish(commandTopic, message)
			}
		})
	}, [publishableTopics, publish])
	const stopStation = useCallback(
		(stationId: number) => {
			console.log('Publishing stop command to topics:', publishableTopics)
			publishableTopics.forEach((topic) => {
				const commandTopic = getCommandTopic(topic)

				const stopCommand: MqttCommand = {
					action: 'Stop',
					stationId,
					cause: 'Manual',
				}
				const message = JSON.stringify(stopCommand)
				console.log(
					'Publishing stop command to topic:',
					commandTopic,
					'Message:',
					message,
				)
				publish(commandTopic, message)
			})
		},
		[publishableTopics, publish],
	)
	const stopAllStations = useCallback(() => {
		console.log('Publishing stop commands to topics:', publishableTopics)
		publishableTopics.forEach((topic) => {
			const commandTopic = getCommandTopic(topic)

			const stopCommand = (stationId: number): MqttCommand => ({
				action: 'Stop',
				stationId,
				cause: 'Manual',
			})

			for (let stationId = 0; stationId <= 4; stationId++) {
				const message = JSON.stringify(stopCommand(stationId))
				console.log(
					'Publishing stop command to topic:',
					commandTopic,
					'Message:',
					message,
				)
				publish(commandTopic, message)
			}
		})
	}, [publishableTopics, publish])

	const setTypeForAreaStation = (
		areaKey: string,
		stationId: number,
		type: StationType,
	) => {
		console.log(
			`Setting station type for area ${areaKey}, station ${stationId} to ${type}`,
		)
		setTypeForAreaStationMqtt(areaKey, stationId, type)
		setTypeForAreaStationStore(areaKey, stationId, type)
	} */
}
