# Docker deployment

## Setup

```bash
cd docker
cp .env.production.example .env
```

Edit `.env` and set at minimum:

- `APP_KEY` — run `php artisan key:generate --show` in `backend/`
- `JWT_SECRET` — run `php artisan jwt:secret --show` in `backend/`
- `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`
- `VITE_API_URL` — public API URL used when building the frontend image (e.g. `http://localhost:8000/api`)

## Start

From project root:

```bash
npm run docker:up
```

Or from this directory:

```bash
docker compose --env-file .env up -d --build
```

## Services

| Service | Port (default) | Role |
|---------|----------------|------|
| **frontend** | 3000 | React static build + nginx |
| **nginx** | 8000 | Laravel API (`/api/*`) |
| **backend** | — | PHP-FPM, migrations on boot |
| **mysql** | 3306 | MySQL 8.0 |
| **redis** | 6379 | Cache / sessions |

### Monitoring profile (`npm run docker:monitoring`)

| **prometheus** | 9090 | Metrics |
| **grafana** | 3001 | Dashboards |
| **elasticsearch** | 9200 | Log storage |
| **logstash** | — | Ingest Laravel logs |
| **kibana** | 5601 | Log UI |

## CI/CD

GitHub Actions workflow: `.github/workflows/ci-cd.yml`  
See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for secrets and rollback.

## Build details

- **Frontend:** `docker/frontend/Dockerfile` runs `npm ci` and `npm run build` with build args `VITE_API_URL`, `VITE_DEFAULT_LOCALE`.
- **Backend:** `docker/backend/Dockerfile` installs PHP extensions (`intl` for locales), Composer deps, and runs `entrypoint.sh` (migrate, cache config).

## Stop

```bash
docker compose down
```
