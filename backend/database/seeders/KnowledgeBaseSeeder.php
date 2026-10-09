<?php

namespace Database\Seeders;

use App\Models\KnowledgeArticle;
use App\Models\KnowledgeFaq;
use App\Models\User;
use Illuminate\Database\Seeder;

class KnowledgeBaseSeeder extends Seeder
{
    public function run(): void
    {
        $authorId = User::query()->value('id');

        KnowledgeArticle::create([
            'code' => 'getting-started',
            'version' => 1,
            'title' => 'Getting Started with WorkSphere',
            'content' => "# Welcome to WorkSphere\n\nWorkSphere centralizes HR, projects, training, and compliance in one place.\n\n## Quick tips\n\n- Use **Requests** for leave and equipment.\n- Check **Training** for upcoming sessions.\n- Visit **Compliance** for policies and contracts.\n\n## Need help?\n\nBrowse FAQs below or ask the AI Assistant.",
            'category' => 'onboarding',
            'is_current' => true,
            'author_id' => $authorId,
        ]);

        KnowledgeArticle::create([
            'code' => 'etape-28-deployment',
            'version' => 1,
            'title' => 'Étape 28 — Déploiement final & CI/CD',
            'content' => <<<'MD'
# Étape 28 — Final Deployment & CI/CD

This guide covers deploying WorkSphere to staging and production.

## Prerequisites

- Docker & Docker Compose
- `APP_KEY`, `JWT_SECRET`, and `DEPLOY_WEBHOOK_SECRET` configured
- GitHub Actions secrets (see `.github/workflows/ci-cd.yml`)

## Local stack

```bash
cd docker
cp .env.example .env
# Edit secrets, then from repo root:
npm run docker:up
```

Services: **frontend** (3000), **API nginx** (8000), **MySQL**, **Redis**, optional **Prometheus/Grafana/ELK** profile.

## CI/CD pipeline

1. **Test** — PHPUnit (backend) and Jest (frontend)
2. **Build** — Docker images for `worksphere-backend` and `worksphere-frontend`
3. **Deploy** — Push to staging on `main`; production on version tags
4. **Notify** — Webhook `POST /api/devops/deployments` with header `X-Deploy-Secret`

## Rollback

From **Admin Dashboard → DevOps**, rollback a failed deployment to the previous successful version.

## Monitoring

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Kibana: http://localhost:5601

## Environment files

| File | Purpose |
|------|---------|
| `docker/.env` | Compose secrets |
| `frontend/.env.production` | Vite prod build |
| `backend/.env` | Laravel runtime |

## Production build (frontend)

```bash
npm run build:frontend -- --mode production
```

Service worker caching is enabled via `vite-plugin-pwa`.
MD,
            'category' => 'devops',
            'is_current' => true,
            'author_id' => $authorId,
        ]);

        KnowledgeArticle::create([
            'code' => 'it-password-reset',
            'version' => 1,
            'title' => 'Resetting Your Password',
            'content' => "## Password reset\n\n1. Go to the login page.\n2. Click **Forgot password**.\n3. Follow the email link within 60 minutes.\n\nContact IT if you do not receive the email within 10 minutes.",
            'category' => 'it',
            'is_current' => true,
            'author_id' => $authorId,
        ]);

        KnowledgeFaq::insert([
            [
                'question' => 'How do I submit a leave request?',
                'answer' => 'Open Requests from the sidebar, choose Leave, fill in dates and reason, then submit. Your manager will be notified.',
                'category' => 'hr',
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'Where can I find company policies?',
                'answer' => 'Published policies are in Compliance. Knowledge Base articles may also summarize key topics.',
                'category' => 'policy',
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question' => 'Who can publish knowledge base articles?',
                'answer' => 'Administrators and managers can create articles and upload documents. All employees can read and search content.',
                'category' => 'general',
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
