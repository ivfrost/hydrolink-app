import { fetchAuthSession } from 'aws-amplify/auth'

export type AwsIoTCredentials = {
	accessKeyId: string
	secretAccessKey: string
	sessionToken: string
	expiration?: Date
}

export type AwsIoTSession = {
	identityId: string
	credentials: AwsIoTCredentials
}

/** Get the authenticated Cognito Identity Pool session for AWS IoT. */
export async function getAwsIoTSession(): Promise<AwsIoTSession> {
	const session = await fetchAuthSession()
	const { identityId, credentials } = session

	if (!identityId || !credentials) {
		throw new Error(
			'AWS IoT credentials are unavailable. Confirm the user is authenticated and the Cognito Identity Pool is linked to the User Pool.',
		)
	}

	if (
		!credentials.accessKeyId ||
		!credentials.secretAccessKey ||
		!credentials.sessionToken
	) {
		throw new Error('AWS IoT credentials are incomplete.')
	}

	return {
		identityId,
		credentials: {
			accessKeyId: credentials.accessKeyId,
			secretAccessKey: credentials.secretAccessKey,
			sessionToken: credentials.sessionToken,
			expiration: credentials.expiration,
		},
	}
}
