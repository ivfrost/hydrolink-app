# Hydrolink App

Hydrolink is a React Native mobile app for monitoring and controlling an IoT
irrigation system. It connects users to their irrigation areas, stations, live
device status, schedules, and firmware updates.

## Stack

- React Native with Expo SDK 57 and Expo Router
- React 19 and TypeScript
- AWS Cognito for authentication
- AWS IoT Core for live device status and commands
- TanStack Query for server state and caching
- Zustand for local device state

## Main features

- Sign in, registration, profile, and account management
- Link irrigation areas using QR codes or link codes
- View live station status and area connectivity
- Start and stop supported stations from the app
- Create and edit fixed-time and relative schedules
- Show upcoming schedules on the dashboard
- Receive firmware update notifications and start OTA updates
- English and Spanish translations

## Architecture

The app authenticates with Cognito and sends the resulting bearer token to the
Hydrolink API. The API derives the application user identity from the
authenticated Cognito subject rather than receiving a Cognito ID from the app.
After authentication, the app uses temporary Cognito Identity Pool credentials
for a read-only live connection to AWS IoT Core. The API remains the source of
truth for users, areas, schedules, and firmware metadata.

## System Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/hl-system-design-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="diagrams/hl-system-design-light.png">
  <img alt="System architecture diagram" src="diagrams/hl-system-design-light.png">
</picture>

## License

This project is licensed under [Creative Commons Attribution-NonCommercial 4.0 International](LICENSE).
