const express = require('express')
const app = express()
app.use(express.json())

const mockUser = {
	id: 1,
	email: 'test@hydro.com',
	username: 'test_user',
	password: 'password123',
	fullName: 'Test User',
	profilePictureUrl: 'https://example.com/profile-picture.jpg',
	phoneNumber: '+1234567890',
	address: '123 Main St',
	preferredLanguage: 'en',
	settings: {
		showSomeFeature: true,
	},
}

const mockAccessToken = {
	type: 'AUTH_ACCESS_TOKEN',
	value: 'mock-access-token-jwt',
	expiryDate: new Date(Date.now() + 3600 * 1000).toISOString(),
}

const mockRefreshToken = {
	type: 'AUTH_REFRESH_TOKEN',
	value: 'mock-refresh-token-jwt',
	expiryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
}

const mockDevices = [
	{
		id: 1,
		name: 'Garden Zone A',
		location: 'Back garden',
		firmware: '1.2.3',
		technicalName: 'HYDRO-AE70F',
		ip: '192.168.1.50',
		createdAt: new Date('2024-01-01').toISOString(),
		updatedAt: new Date('2024-06-01').toISOString(),
		linkedAt: new Date('2024-01-15').toISOString(),
		lastSeen: new Date().toISOString(),
		userId: 1,
		order: 1,
	},
	{
		id: 2,
		name: 'Front Lawn',
		location: 'Front garden',
		firmware: '1.2.3',
		technicalName: 'HYDRO-BB71E',
		ip: '192.168.1.51',
		createdAt: new Date('2024-01-01').toISOString(),
		updatedAt: new Date('2024-06-01').toISOString(),
		linkedAt: new Date('2024-01-20').toISOString(),
		lastSeen: new Date().toISOString(),
		userId: 1,
		order: 2,
	},
]

const apiResponse = (status, message, details = null, error = null) => ({
	timestamp: new Date().toISOString(),
	status,
	error,
	message,
	details,
})

app.post('/v1/users/auth', (req, res) => {
	const { email, password } = req.body
	console.log(email, password)

	if (email !== mockUser.email || password !== mockUser.password) {
		console.log('Invalid email or password')
		return res
			.status(401)
			.json(apiResponse(401, 'Invalid credentials', null, 'Unauthorized'))
	}
	console.log('User authenticated successfully')

	res.cookie('refreshToken', mockRefreshToken.value, {
		httpOnly: true,
		path: '/v1/users/auth/refresh',
	})

	res
		.status(200)
		.json(
			apiResponse(200, 'User authenticated successfully', [
				mockAccessToken,
				mockRefreshToken,
			]),
		)
})

app.post('/v1/users/auth/refresh', (req, res) => {
	const auth = req.headers.authorization

	if (!auth || auth !== 'Bearer mock-refresh-token-jwt') {
		console.log('Invalid refresh token')
		return res
			.status(401)
			.json(apiResponse(401, 'Invalid refresh token', null, 'Unauthorized'))
	}

	console.log('Tokens refreshed successfully')
	res
		.status(200)
		.json(
			apiResponse(200, 'Tokens refreshed successfully', [
				{ ...mockAccessToken, value: 'new-mock-access-token-jwt' },
				mockRefreshToken,
			]),
		)
})

app.post('/v1/users', (req, res) => {
	const { email, username, fullName, password, preferredLanguage } = req.body

	if (!email || !username || !fullName || !password || !preferredLanguage) {
		return res
			.status(400)
			.json(apiResponse(400, 'All fields are required', null, 'Bad Request'))
	}

	console.log(
		`User registered successfully: ${email}, ${username}, ${fullName}, ${preferredLanguage}`,
	)
	mockUser.email = email
	mockUser.username = username
	mockUser.fullName = fullName
	mockUser.password = password
	mockUser.preferredLanguage = preferredLanguage
	res
		.status(201)
		.json(
			apiResponse(201, 'User registered successfully', [
				mockAccessToken,
				mockRefreshToken,
			]),
		)
})

app.get('/v1/me', (req, res) => {
	console.log('User profile retrieved successfully')
	res
		.status(200)
		.json(apiResponse(200, 'User profile retrieved successfully', mockUser))
})

app.put('/v1/me', (req, res) => {
	const {
		username,
		password,
		currentPassword,
		fullName,
		email,
		phoneNumber,
		address,
		preferredLanguage,
		settings,
	} = req.body

	const isChangingPassword = password !== undefined && password.trim() !== ''
	const isChangingEmail =
		email !== undefined &&
		email.trim() !== '' &&
		email.trim().toLowerCase() !== mockUser.email.toLowerCase()

	if (isChangingPassword || isChangingEmail) {
		if (!currentPassword || currentPassword.trim() === '') {
			console.log(
				'Validation failed: Current password missing for credential change',
			)
			return res
				.status(400)
				.json(
					apiResponse(
						400,
						'Current password must be provided to update credentials.',
						null,
						'Bad Request',
					),
				)
		}

		if (currentPassword !== mockUser.password) {
			console.log('Validation failed: Invalid credentials')
			return res
				.status(401)
				.json(apiResponse(401, 'Invalid credentials', null, 'Unauthorized'))
		}

		if (isChangingPassword) {
			mockUser.password = password
			console.log('Password updated in mock')
		}

		if (isChangingEmail) {
			const cleanEmail = email.trim().toLowerCase()

			if (cleanEmail === 'taken@email.com') {
				console.log('Validation failed: Email already in use')
				return res
					.status(400)
					.json(
						apiResponse(
							400,
							'Email address is already in use by another account.',
							null,
							'Bad Request',
						),
					)
			}

			mockUser.email = cleanEmail
			console.log('Email updated in mock')
		}
	}

	if (username && username.trim() !== '') mockUser.username = username
	if (fullName && fullName.trim() !== '') mockUser.fullName = fullName
	if (phoneNumber !== undefined) mockUser.phoneNumber = phoneNumber
	if (address !== undefined) mockUser.address = address
	if (preferredLanguage && preferredLanguage.trim() !== '')
		mockUser.preferredLanguage = preferredLanguage
	if (settings !== undefined) mockUser.settings = settings

	console.log('User profile updated successfully')

	return res.status(200).json(
		apiResponse(200, 'User profile updated successfully', {
			id: mockUser.id,
			username: mockUser.username,
			fullName: mockUser.fullName,
			email: mockUser.email,
			phoneNumber: mockUser.phoneNumber,
			address: mockUser.address,
			preferredLanguage: mockUser.preferredLanguage,
			settings: mockUser.settings,
		}),
	)
})

app.post('/v1/me/devices/link', (req, res) => {
	const { secret } = req.body

	if (!secret) {
		console.log('Secret is required')
		return res
			.status(400)
			.json(apiResponse(400, 'Secret is required', null, 'Bad Request'))
	}

	if (secret !== 'a3f9c72b1e4d8f0632c0875b6c977839') {
		console.log('Device not found')
		return res
			.status(404)
			.json(apiResponse(404, 'Device not found', null, 'Not Found'))
	}

	console.log('Device linked successfully')
	res.status(200).json(apiResponse(200, 'Device linked successfully'))
})

app.get('/v1/me/devices', (req, res) => {
	console.log('User devices retrieved successfully')
	res
		.status(200)
		.json(apiResponse(200, 'User devices retrieved successfully', mockDevices))
})

app.listen(3000, () => console.log('Mock server listening on port 3000'))
