# WorkSphere

Full-stack, monorepo HR / workspace platform: a **React 19** web app, a **Laravel 11** REST API, a **React Native (Expo)** companion app, and Docker/CI tooling.

## Monorepo structure

```
WorkSphere/
├── frontend/       # React 19 + TypeScript + Vite + TailwindCSS v4 + Redux Toolkit (web app)
├── backend/        # Laravel 11 REST API (JWT + Sanctum), PHPUnit tests
├── mobile/         # React Native (Expo) app: expo-router, secure-store, notifications
├── analytics-ml/   # Optional Python (Flask) predictive-analytics microservice
├── docker/         # Docker Compose, nginx, php-fpm, monitoring (Prometheus/Grafana/ELK)
├── docs/           # Deployment & mobile/push documentation
├── scripts/        # Developer helper scripts (start-backend.ps1)
├── .github/        # GitHub Actions CI/CD workflow
└── README.md
```

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Web frontend** | React 19, TypeScript, Vite 8, TailwindCSS v4, Redux Toolkit, React Router 7, Axios, i18next (EN/FR/AR), FullCalendar, Recharts, jsPDF, xlsx, Laravel Echo + Pusher, vite-plugin-pwa, Sentry (optional) |
| **Mobile** | React Native 0.76 / Expo 52, expo-router, expo-secure-store, expo-local-authentication, expo-notifications |
| **Backend** | Laravel 11 (PHP 8.2), `php-open-source-saver/jwt-auth` (JWT) + Laravel Sanctum, Pusher PHP server, dompdf, QR codes |
| **Database** | MySQL 8 (Docker) or SQLite (local default) |
| **ML service** | Python 3 + Flask (`analytics-ml/app.py`, optional) |
| **Deployment** | Docker Compose (nginx, php-fpm, MySQL, Redis, static frontend), GitHub Actions → GHCR |

## Quick start

Prerequisites: **Node.js 20+**, **PHP 8.2 + Composer**, and Git. Docker is optional.

### 1. Backend (API)

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
```

Start the API from the repo root (kills stale processes on the dev port):

```powershell
.\scripts\start-backend.ps1
```

or manually: `cd backend; php artisan serve --host=127.0.0.1 --port=8765`.

### 2. Frontend (web)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` to the backend.

### 3. Mobile (optional)

See [`mobile/README.md`](mobile/README.md). Run with `npm run dev:mobile` from the root.

## Demo accounts (local seed only)

`php artisan db:seed --class=UserSeeder` creates three accounts. These are **local demo
accounts declared in `backend/database/seeders/UserSeeder.php`** — never ship them to a
real environment; change or remove them before production.

| Email | Role |
|-------|------|
| `admin@worksphere.test` | admin |
| `manager@worksphere.test` | manager |
| `employee@worksphere.test` | employee |

The shared demo password is defined in the seeder above. If login fails, run
`php artisan worksphere:reset-demo-passwords`.

## Authentication & roles

Three roles: **admin**, **manager**, **employee**. New registrations get the **employee** role.
Passwords are hashed via Laravel's `hashed` cast. API routes are protected by JWT
(`auth:api`); optional Sanctum tokens are available via `POST /api/auth/sanctum-token`.
The frontend redirects to `/dashboard/admin`, `/dashboard/manager`, or `/dashboard/employee`
after login.

## Feature modules

Routes are defined in `backend/routes/api.php`; the role guards appear in parentheses.

- **Auth** — register, login, forgot/reset password, `me`, logout, JWT refresh, locale update.
- **HR** — employees, attendance (check-in/out, reports, calendar), leaves (approval workflow),
  payroll (net salary computed server-side, admin/manager only), evaluations, performance
  (goals, reviews, 360 feedback), training, skills, recruitment (job postings, candidates,
  onboarding tasks, resume preview/download).
- **Work management** — projects (+ board, overview, milestones, export), tasks, calendar
  events, internal requests, documents (upload/preview/download).
- **Service desk & messaging** — helpdesk tickets (SLA, categories, suggestions, assignment,
  comments, live chat), conversations/messages with attachments and typing indicators.
- **Business** — CRM (clients, partners, deals, interactions), finance/expenses/budgets,
  accounting (invoices, transactions), inventory (items, suppliers, purchase orders, stock
  movements, QR lookup), assets (assignment, returns, maintenance).
- **Governance** — compliance (policies, contracts, e-sign), knowledge base (articles,
  versions, ratings, FAQs, documents), reports, analytics/insights, audit logs, security
  (alerts, permissions, integrity check).
- **Platform** — integrations (connect/test/sync, webhook & message logs), settings &
  approval workflows, gamification (points, badges, leaderboard), AI assistant, mobile APIs
  (dashboard, notifications, device tokens, offline sync), DevOps deployments & rollback.
- **Dashboards** — admin, manager, employee, plus `dashboard/analytics`.

## REST API

Base URL: `http://localhost:8765/api` (dev) or `http://localhost:8000/api` (Docker).

- Public: `GET /health`, `POST /auth/register`, `POST /auth/login`,
  `POST /auth/forgot-password`, `POST /auth/reset-password`.
- Authenticated: JWT bearer token in `Authorization: Bearer <token>`.
- Send `X-Locale: en|fr|ar` to localize API messages.

A full route listing is in `backend/routes/api.php`.

## Internationalization

- **Backend**: `backend/lang/{en,fr,ar}` + a `locale` column on users, applied by middleware.
- **Frontend**: i18next with `frontend/src/locales/{en,fr,ar}.json`, navbar language switcher, RTL for Arabic.
- **Mobile**: locale follows the user profile.

## Real-time, push & AI

- **Real-time** — Laravel Echo + Pusher (or [Soketi](https://soketi.app/) locally). Configure
  `PUSHER_*` in `backend/.env` and `VITE_PUSHER_*` in `frontend/.env`.
- **Push (FCM)** — see [`docs/MOBILE_AND_PUSH.md`](docs/MOBILE_AND_PUSH.md); set
  `FIREBASE_CREDENTIALS` (and optional `FCM_SERVER_KEY`) in `backend/.env`.
- **AI assistant** — enabled with `AI_ENABLED=true` and an `OPENAI_API_KEY` (or Anthropic key);
  otherwise the assistant endpoints have no provider configured.
- **Predictive analytics (optional)** — run `analytics-ml/app.py` and set
  `ANALYTICS_ML_SERVICE_URL` in `backend/.env`.

## Testing

| Scope | Command | Location |
|-------|---------|----------|
| Backend (PHPUnit) | `php artisan test` | `backend/` |
| Frontend (Jest) | `npm run test` | `frontend/` |
| Frontend lint | `npm run lint` | `frontend/` |

Convenience scripts from the repo root: `npm run test:frontend`, `npm run lint:frontend`,
`npm run build:frontend`.

## Build

```bash
npm run build:frontend     # or: cd frontend && npm run build
```

Emits the static bundle and PWA service worker to `frontend/dist/` (git-ignored).

## Docker deployment

```bash
cd docker
cp .env.example .env       # set APP_KEY, JWT_SECRET, MYSQL_* and VITE_API_URL
cd ..
npm run docker:up          # docker compose -f docker/docker-compose.yml --env-file docker/.env up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API (nginx) | http://localhost:8000/api |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

Optional monitoring stack (Prometheus, Grafana, ELK): `npm run docker:monitoring`.
See [`docker/README.md`](docker/README.md) and [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## CI/CD

`.github/workflows/ci-cd.yml` runs backend + frontend tests, builds frontend, publishes
Docker images to GHCR on `main`/tags, and notifies deployment webhooks. Required secrets
are listed in `docs/DEPLOYMENT.md`.

## Known limitations

- **Frontend test coverage is minimal** — currently a single environment smoke test
  (`frontend/src/__tests__/env.test.ts`). Backend has 11 PHPUnit tests.
- **Bundle size** — the main JS chunk exceeds 500 kB; code-splitting is a possible improvement.
- **Optional integrations** (Pusher/Soketi, FCM, OpenAI/Anthropic, Sentry, ML service) require
  external configuration and are inactive until configured.
- **`analytics-ml/app.py`** is a lightweight Flask heuristic scorer, not a trained ML model.
- **Mobile** push-token registration must be wired for production builds (see mobile docs).

## Security notes

- Never commit `.env` files; only the `*.example` templates are versioned.
- `APP_KEY` (Laravel encryption) and `JWT_SECRET` (jwt-auth signing) must be generated per
  environment with `php artisan key:generate` and `php artisan jwt:secret`. Do not reuse the
  values from a shared/development environment in production.
