import { Amplify } from 'aws-amplify'

function requireEnv(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(`${name} is missing`)
	}
	return value
}

const userPoolId = requireEnv(
	'EXPO_PUBLIC_AWS_USER_POOL_ID',
	process.env.EXPO_PUBLIC_AWS_USER_POOL_ID,
)
const userPoolClientId = requireEnv(
	'EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID',
	process.env.EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID,
)
const identityPoolId = requireEnv(
	'EXPO_PUBLIC_AWS_IDENTITY_POOL_ID',
	process.env.EXPO_PUBLIC_AWS_IDENTITY_POOL_ID,
)

Amplify.configure({
	Auth: {
		Cognito: {
			userPoolId,
			userPoolClientId,
			identityPoolId,
			allowGuestAccess: false,
		},
	},
})
