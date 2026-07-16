import { QueryClient } from '@tanstack/react-query'
import { assign, fromPromise, setup } from 'xstate'

import { tanstackKeys } from '@/constants'
import { MqttContextType } from '@/context/MqttContext'
import { areaUpdateMutationFn } from '@/mutations/areas'
import { areasQueryFn } from '@/queries/areas'
import { AppError } from '@/types/api'
import { Area, AreaUpdatePayload } from '@/types/area'

export const currentScreenMachine = setup({
	types: {
		input: {} as {
			queryClient: QueryClient
			mqtt: MqttContextType
		},
		context: {} as {
			queryClient: QueryClient
			mqtt: MqttContextType
			areas: Area[] | undefined
			error: AppError | null
			pendingSave: Partial<AreaUpdatePayload> | null
			pendingStationTypeChange: Record<number, string | undefined>
		},
		events: {} as
			| { type: 'LOAD' }
			| { type: 'SAVE'; payload: Partial<AreaUpdatePayload> }
			| { type: 'DISCARD' }
			| { type: 'RETRY' }
			| { type: 'RETRY_MQTT' }
			| { type: 'SET_TYPE_STATION'; stationId: number; newType: string }
			| { type: 'STATION_STATUS_UPDATE'; stationId: number; newType: string },
	},

	actors: {
		fetchAreas: fromPromise<Area[], { queryClient: QueryClient }>(
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
			Area,
			{ queryClient: QueryClient; payload: Partial<AreaUpdatePayload> }
		>(async ({ input }) => {
			const result = await areaUpdateMutationFn(input.payload)
			await input.queryClient.invalidateQueries({
				queryKey: [tanstackKeys.AREAS],
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
				SET_TYPE_STATION: {
					actions: assign({
						pendingStationTypeChange: ({ context, event }) => ({
							...context.pendingStationTypeChange,
							[event.stationId]: event.newType,
						}),
					}),
				},
				STATION_STATUS_UPDATE: {
					actions: assign({
						pendingStationTypeChange: ({ context, event }) => {
							const requestedType =
								context.pendingStationTypeChange[event.stationId]
							// only clear if ESP type matches what we requested
							if (requestedType && requestedType === event.newType) {
								const { [event.stationId]: _, ...rest } =
									context.pendingStationTypeChange
								return rest
							}
							return context.pendingStationTypeChange
						},
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
					target: 'ready',
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
		failure: {
			on: {
				RETRY: { target: 'loading' },
				RETRY_MQTT: { target: 'requestMqttData' },
			},
		},
	},
})
