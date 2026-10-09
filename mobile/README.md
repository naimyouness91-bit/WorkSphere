# WorkSphere Mobile

React Native (Expo) companion app for WorkSphere.

## Features

- JWT authentication with optional biometric login (Face ID / fingerprint)
- Dashboard KPIs (Requests, Training, Payroll, Analytics)
- Quick actions and notifications center
- Notification preferences (push, in-app, email)
- Offline cache for dashboard + sync queue for requests
- Dark mode and branded splash screen

## Setup

1. Install dependencies:

```bash
cd mobile
npm install
```

2. Copy environment file and set your API URL (use your LAN IP for physical devices):

```bash
cp .env.example .env
```

3. Start the Laravel API (`scripts/start-backend.ps1` from project root).

4. Run the app:

```bash
npm start
```

Press `a` for Android emulator or `i` for iOS simulator.

## Push notifications (FCM)

1. Create a Firebase project and download the service account JSON.
2. In `backend/.env`:

```env
FIREBASE_CREDENTIALS=/absolute/path/to/firebase-service-account.json
```

3. Register for push on device — the app calls `POST /api/mobile/device-tokens` after login (wire `expo-notifications` token in production build).

## API endpoints used

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/mobile/dashboard` | Mobile KPIs + activity |
| GET | `/api/mobile/notifications` | Notification list |
| PATCH | `/api/mobile/notification-preferences` | User prefs |
| POST | `/api/mobile/device-tokens` | Register FCM token |
| POST | `/api/mobile/requests` | Submit request |
| POST | `/api/mobile/sync` | Offline action sync |
