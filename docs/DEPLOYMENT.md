# WorkSphere — Deployment & CI/CD

## Quick start (Docker)

```bash
cd docker
cp .env.example .env
# Set APP_KEY, JWT_SECRET, DEPLOY_WEBHOOK_SECRET
cd ..
npm run docker:up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000/api |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

### Monitoring stack (optional)

```bash
npm run docker:monitoring
```

| Tool | URL |
|------|-----|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |
| Kibana | http://localhost:5601 |

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/ci-cd.yml`

1. **test-backend** — `php artisan test` (PHPUnit, SQLite in-memory)
2. **test-frontend** — `npm test` (Jest) + staging build
3. **build-images** — Docker images to GHCR on `main` / version tags
4. **deploy-staging** / **deploy-production** — webhook to API

### Required GitHub secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_WEBHOOK_SECRET` | Matches backend `DEPLOY_WEBHOOK_SECRET` |
| `STAGING_API_URL` | e.g. `https://staging.example.com` |
| `PRODUCTION_API_URL` | e.g. `https://api.example.com` |

## Environment files

- `docker/.env` — Compose orchestration
- `backend/.env` — Laravel runtime
- `frontend/.env.development` — local Vite
- `frontend/.env.staging` — from `.env.staging.example`
- `frontend/.env.production` — from `.env.production.example`

## Rollback

Admin → Dashboard → **DevOps** panel → **Rollback** on failed deployments.

## Knowledge Base

See article **Étape 28 — Déploiement final & CI/CD** (`/knowledge`, code `etape-28-deployment`).
