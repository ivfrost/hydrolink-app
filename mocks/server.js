const express = require('express')
const app = express()
app.use(express.json())

const mockUser = {
	id: 1,
	email: 'test@hydro.com',
	username: 'test_user',
	fullName: 'Test User',
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

	if (email !== mockUser.email || password !== 'password123') {
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

	res.status(200).json(
		// TODO: Send header from react-native app to server so it knows to send
		// the refresh token in the response body
		apiResponse(200, 'User authenticated successfully', [
			mockAccessToken,
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
	res
		.status(200)
		.json(apiResponse(200, 'User profile retrieved successfully', mockUser))
})

app.listen(3000, () => console.log('Mock server listening on port 3000'))
