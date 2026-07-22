import { QueryClient } from '@tanstack/react-query'
import { assign, fromPromise, setup } from 'xstate'

import { tanstackKeys } from '@/constants'
import { MqttContextType } from '@/context/MqttContext'
import { areaUpdateMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { AppError } from '@/types/api'
import { AreaDbData, AreaUpdatePayload } from '@/types/area'

const fieldToContextKey = {
	type: 'pendingStationTypeChange',
	name: 'pendingStationNameChange',
	description: 'pendingStationDescriptionChange',
	imageUrl: 'pendingStationImageUrlChange',
} as const

export const currentScreenMachine = setup({
	types: {
		input: {} as {
			queryClient: QueryClient
			mqtt: MqttContextType
		},
		context: {} as {
			queryClient: QueryClient
			mqtt: MqttContextType
			areas: AreaDbData[] | undefined
			error: AppError | null
			pendingSave: Partial<AreaUpdatePayload> | null
			pendingStationTypeChange: Record<number, string | undefined>
			pendingStationNameChange: Record<number, string | undefined>
			pendingStationDescriptionChange: Record<number, string | undefined>
			pendingStationImageUrlChange: Record<number, string | undefined>
			pendingStationActions: Record<number, { targetState: 'Running' | 'Idle' }>
		},
		events: {} as
			| { type: 'LOAD' }
			| { type: 'SAVE'; payload: Partial<AreaUpdatePayload> }
			| { type: 'DISCARD' }
			| { type: 'RETRY' }
			| { type: 'RETRY_MQTT' }
			// Request to set a station field, sent from the UI to the state machine
			// context and then to the MQTT context.
			| {
					type: 'SET_STATION_FIELD'
					field: 'type' | 'name' | 'description' | 'imageUrl'
					stationId: number
					newValue: string
			  }
			// Confirmation from ESP that a station field has been updated, used to
			// clear pending changes from the state machine context.
			| {
					type: 'STATION_STATUS_UPDATE'
					field: 'type' | 'name' | 'description' | 'imageUrl'
					stationId: number
					newValue: string
			  }
			| {
					type: 'INITIATE_STATION_ACTION'
					stationId: number
					targetState: 'Running' | 'Idle'
			  }
			// Fired when MQTT receives actual hardware state confirmation from ESP
			| {
					type: 'STATION_STATE_CONFIRMED'
					stationId: number
					state: 'Running' | 'Idle'
			  },
	},
	actors: {
		fetchAreas: fromPromise<AreaDbData[], { queryClient: QueryClient }>(
			async ({ input }) => {
				return input.queryClient.fetchQuery({
					queryKey: tanstackKeys.AREAS,
					queryFn: areasQueryFn,
				})
			},
		),
		requestMqttData: fromPromise<void, { mqtt: MqttContextType }>(
			async ({ input }) => {
				if (!input.mqtt.isReady) {
					throw new AppError('MQTT_ERROR', 'MQTT client is not ready')
				}
				input.mqtt.requestStatusSnapshot()
			},
		),
		saveArea: fromPromise<
			AreaDbData,
			{ queryClient: QueryClient; payload: Partial<AreaUpdatePayload> }
		>(async ({ input }) => {
			const result = await areaUpdateMutationFn(input.payload)
			await input.queryClient.invalidateQueries({
				queryKey: [tanstackKeys.AREAS],
				refetchType: 'all',
			})
			return result
		}),
	},
	actions: {
		syncAreaState: () => {},
		resetAreaState: () => {},
	},
}).createMachine({
	id: 'currentScreen',
	initial: 'loading',
	context: ({ input }) => ({
		queryClient: input.queryClient,
		mqtt: input.mqtt,
		areas: undefined,
		error: null,
		pendingSave: null,
		pendingStationTypeChange: {},
		pendingStationNameChange: {},
		pendingStationDescriptionChange: {},
		pendingStationImageUrlChange: {},
		pendingStationActions: {},
	}),
	states: {
		loading: {
			invoke: {
				src: 'fetchAreas',
				input: ({ context }) => ({ queryClient: context.queryClient }),
				onDone: {
					target: 'requestMqttData',
					actions: assign({
						areas: ({ event }) => event.output,
					}),
				},
				onError: {
					target: 'failure',
					actions: assign({
						error: ({ event }) => event.error as AppError,
					}),
				},
			},
		},
		requestMqttData: {
			invoke: {
				src: 'requestMqttData',
				input: ({ context }) => ({ mqtt: context.mqtt }),
				onDone: { target: 'success' },
				onError: {
					target: 'failure',
					actions: assign({
						error: ({ event }) => event.error as AppError,
					}),
				},
			},
		},
		success: {
			always: [
				{
					target: 'empty',
					guard: ({ context }) => !context.areas || context.areas.length === 0,
				},
				{ target: 'ready' },
			],
		},
		empty: {
			on: {
				RETRY: { target: 'loading' },
			},
		},
		ready: {
			entry: 'syncAreaState',
			on: {
				SAVE: {
					target: 'saving',
					actions: assign({
						pendingSave: ({ event }) => event.payload,
					}),
				},
				DISCARD: { actions: 'resetAreaState' },
				RETRY: { target: 'loading' },
				RETRY_MQTT: { target: 'requestMqttData' },
				INITIATE_STATION_ACTION: {
					actions: assign(({ context, event }) => ({
						pendingStationActions: {
							...context.pendingStationActions,
							[event.stationId]: { targetState: event.targetState },
						},
					})),
				},
				// Triggered when MQTT listener receives confirmed status from the ESP device
				STATION_STATE_CONFIRMED: {
					actions: assign(({ context, event }) => {
						const pending = context.pendingStationActions[event.stationId]

						// Clear loading/pending state once confirmed state matches expected target state
						if (pending && pending.targetState === event.state) {
							const { [event.stationId]: _, ...rest } =
								context.pendingStationActions
							return { pendingStationActions: rest }
						}

						return {}
					}),
				},
				SET_STATION_FIELD: {
					actions: assign(({ context, event }) => {
						const key = fieldToContextKey[event.field]
						const currentMap = context[key]
						if (currentMap[event.stationId] === event.newValue) return {}
						return {
							[key]: { ...currentMap, [event.stationId]: event.newValue },
						}
					}),
				},
				STATION_STATUS_UPDATE: {
					actions: assign(({ context, event }) => {
						const key = fieldToContextKey[event.field]
						const currentMap = context[key]
						const requestedValue = currentMap[event.stationId]

						if (requestedValue && requestedValue === event.newValue) {
							const { [event.stationId]: _, ...rest } = currentMap
							return { [key]: rest }
						}
						return {}
					}),
				},
			},
		},
		saving: {
			invoke: {
				src: 'saveArea',
				input: ({ context }) => ({
					queryClient: context.queryClient,
					payload: context.pendingSave!,
				}),
				onDone: {
					target: 'syncingDevice',
					actions: assign({
						areas: ({ context, event }) =>
							context.areas?.map((a) =>
								a.key === event.output.key ? event.output : a,
							),
						pendingSave: () => null,
						error: () => null,
					}),
				},
				onError: {
					target: 'failure',
					actions: assign({
						error: ({ event }) => event.error as AppError,
						pendingSave: () => null,
					}),
				},
			},
		},
		syncingDevice: {
			on: {
				// Keep listening for updates from the ESP until all pending changes
				// have been cleared, then go back to ready state
				STATION_STATUS_UPDATE: {
					actions: assign(({ context, event }) => {
						const currentMap = context[
							fieldToContextKey[event.field]
						] as Record<number, string | undefined>
						const requestedValue = currentMap[event.stationId]

						if (requestedValue && requestedValue === event.newValue) {
							const { [event.stationId]: _, ...rest } = currentMap
							return { [fieldToContextKey[event.field]]: rest }
						}
						return {}
					}),
				},
			},
			// First check if there are any pending changes for station fields, if
			// there are, wait for them to be cleared before going back to ready state
			always: {
				target: 'ready',
				guard: ({ context }) =>
					Object.keys(context.pendingStationTypeChange).length === 0 &&
					Object.keys(context.pendingStationNameChange).length === 0 &&
					Object.keys(context.pendingStationDescriptionChange).length === 0 &&
					Object.keys(context.pendingStationImageUrlChange).length === 0,
			},
		},
		failure: {
			on: {
				RETRY: { target: 'loading' },
				RETRY_MQTT: { target: 'requestMqttData' },
			},
		},
	},
})
