# Mobile App & Push Notifications

## Overview

WorkSphere includes:

- **React Native (Expo)** app in `/mobile`
- **FCM push** via `FcmPushService` (HTTP v1 or legacy server key)
- **Extended notifications** with `title`, `category` (request, payroll, training, system)
- **Device tokens** and **notification preferences**

## Push triggers

| Event | Category | Recipients |
|-------|----------|------------|
| Request approved/rejected | `request` | Employee |
| Payroll created/updated | `payroll` | User matching employee email |
| Training scheduled | `training` | Assignees |
| Failed login | `system` | Admins & managers |

## Configuration

```env
# backend/.env
FIREBASE_CREDENTIALS=/path/to/serviceAccount.json
FCM_SERVER_KEY=           # optional legacy fallback
FRONTEND_URL=http://localhost:5173
```

## Mobile development

```bash
npm run dev:mobile
```

See `mobile/README.md` for full setup.
