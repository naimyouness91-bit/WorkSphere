# WorkSphere — Frontend

Single-page application for WorkSphere, built with **React 19 + TypeScript + Vite + TailwindCSS v4 + Redux Toolkit**.

It talks to the Laravel REST API in `../backend` (see the [root README](../README.md)).

## Tech stack

- **React 19** + **React Router 7** (`react-router-dom`)
- **Vite 8** build tooling, **TypeScript**
- **Redux Toolkit** + **React Redux** for state
- **TailwindCSS v4** (`@tailwindcss/vite`)
- **Axios** for HTTP
- **i18next** / **react-i18next** (English, French, Arabic with RTL)
- **FullCalendar** (calendar views), **Recharts** (charts)
- **jsPDF + jspdf-autotable** and **xlsx** for PDF/Excel export
- **laravel-echo + pusher-js** for real-time notifications
- **vite-plugin-pwa** (service worker / installable app)
- **Sentry** (`@sentry/react`, optional via `VITE_SENTRY_DSN`)
- **idb** (IndexedDB) for offline caching
- **Jest** (jsdom environment) for tests, **ESLint** (flat config) for linting

## Project structure

```
frontend/
├── src/
│   ├── components/     # reusable UI (auth, layouts, feature widgets)
│   ├── pages/          # route-level screens
│   ├── store/          # Redux Toolkit slices
│   ├── services/       # API clients (axios)
│   ├── locales/        # en.json, fr.json, ar.json
│   ├── i18n/           # i18next setup
│   ├── offline/        # IndexedDB offline cache + sync queue
│   ├── hooks/ utils/ types/ config/ lib/
│   └── __tests__/      # Jest tests
├── public/
├── vite.config.ts      # dev proxy, PWA, chunking
├── eslint.config.js
└── jest.config.cjs
```

## Features (routes)

Routes are declared in `src/App.tsx`. Access is role-based (`admin`, `manager`, `employee`).

- **Auth**: `/login`, `/register`, `/forgot-password`, `/reset-password`
- **Dashboards**: `/dashboard/admin`, `/dashboard/manager`, `/dashboard/employee` (+ `/dashboard` role redirect)
- **HR**: employees, attendance, leaves, payroll, evaluations, performance, training, skills, recruitment, jobs, applications
- **Work**: projects (+ project detail), tasks, calendar, requests, documents
- **Service desk**: tickets/helpdesk (SLA, suggestions, live chat), chat/messaging
- **Business**: CRM, finance, budgets, accounting-related views, inventory, assets
- **Company**: compliance (policies, contracts), knowledge base, reports, analytics
- **Platform**: integrations, audit logs, security, settings/workflows, gamification, AI assistant, mobile-offline, notification center

All screens call the Laravel API through `src/services/*` (no mocked data).

## Getting started

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm install
cp .env.example .env   # adjust if needed
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api` to the backend
(`VITE_DEV_API_PROXY`, default `http://127.0.0.1:8765`). Start the backend first
(`npm run dev:backend` from the repo root, or `scripts/start-backend.ps1`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server (HMR) |
| `npm run build` | Type-check (`tsc -b`) and build for production into `dist/` |
| `npm run build:staging` | Build with `.env.staging` |
| `npm run build:production` | Build with `.env.production` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run Jest tests |
| `npm run lint` | Run ESLint |

## Environment variables

Copy one of the provided templates:

- `.env.example` — local development
- `.env.staging.example` — staging
- `.env.production.example` — production

Key variables: `VITE_APP_ENV`, `VITE_API_URL`, `VITE_API_BASE_URL`,
`VITE_DEV_API_PROXY`, `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_HOST/PORT/SCHEME`,
`VITE_DEFAULT_LOCALE`, optional `VITE_SENTRY_DSN`.

## Internationalization

UI strings live in `src/locales/{en,fr,ar}.json`; the language switcher is in the
navbar and the Arabic locale renders right-to-left. The selected locale is also sent
to the API (`X-Locale`) so backend messages follow the UI language.

## Testing & linting

```bash
npm run test    # Jest (jsdom)
npm run lint    # ESLint flat config
```

> Test coverage is currently minimal: only a smoke test for the environment config
> (`src/__tests__/env.test.ts`). Add feature tests before relying on CI for regressions.

## Building

```bash
npm run build
```

The bundle is emitted to `dist/` (git-ignored) together with the PWA service worker.
The main JS chunk is large (> 500 kB); code-splitting is a possible future optimization.

## Optional integrations

These require configuration on the backend or in the environment and degrade
gracefully when absent:

- **Real-time notifications** — Laravel Echo/Pusher; set `VITE_PUSHER_*` and backend `PUSHER_*`.
- **AI assistant** — backend `AI_ENABLED` + `OPENAI_API_KEY` (or Anthropic).
- **Error tracking** — `VITE_SENTRY_DSN`.
