# Deployment — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18

---

## Infrastructure Overview

```
┌─────────────────────────────────────────────────┐
│                    Internet                      │
└────────┬─────────────────┬──────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────┐ ┌──────────────────┐
│    Vercel        │ │    Railway        │
│                  │ │                   │
│  Next.js 15      │ │  Long-running    │
│  API Routes      │ │  Agent container  │
│  Edge Functions  │ │  (@yndr/engine)   │
│  Static Assets   │ │                   │
└────────┬─────────┘ └────────┬─────────┘
         │                    │
         │     ┌──────────────┘
         ▼     ▼
┌──────────────────────┐
│      Supabase        │
│                      │
│  PostgreSQL (DB)     │
│  Auth (JWT)          │
│  Realtime (WS)       │
│  Storage (files)     │
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│    Inngest Cloud     │
│                      │
│  Cron Jobs           │
│  Event Functions     │
│  Step Functions      │
└──────────────────────┘
```

---

## Environments

| Environment | Purpose | URL | Branch |
|-------------|---------|-----|--------|
| **Local** | Development | `http://localhost:3000` | Any |
| **Preview** | PR review | `https://<branch>.yndr-harness.vercel.app` | PR branches |
| **Staging** | Pre-production testing | `https://staging.harness.yndr.dev` | `develop` |
| **Production** | Live application | `https://harness.yndr.dev` | `main` |

---

## Vercel Configuration

### Project Setup

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link project
vercel link --project yndr-harness

# Set root directory
# Vercel Dashboard → Settings → Root Directory: apps/web
```

### vercel.json

```json
{
  "buildCommand": "cd ../.. && turbo run build --filter=web",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

### Build Settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && turbo run build --filter=web` |
| Install Command | `cd ../.. && pnpm install` |
| Output Directory | `.next` |
| Node.js Version | 20.x |

### Function Configuration

```typescript
// next.config.ts
export default {
  // API routes that call Claude need extended timeout
  serverExternalPackages: ["@anthropic-ai/sdk"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};
```

**Vercel Pro plan required** for:
- 300-second function timeout (for inline run execution)
- Edge middleware (auth checks)
- Analytics

---

## Railway Configuration

### Service Setup

Railway runs the engine package as a standalone service for long-running playbook executions.

```dockerfile
# Railway Dockerfile (packages/engine/Dockerfile)
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/engine ./packages/engine
COPY packages/db ./packages/db
RUN npm install -g pnpm && pnpm install --filter=@yndr/engine...
RUN pnpm --filter=@yndr/engine build
EXPOSE 8080
CMD ["node", "packages/engine/dist/server.js"]
```

### Environment

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for DB writes |
| `PORT` | Railway assigns automatically (8080) |
| `RAILWAY_ENVIRONMENT` | `staging` or `production` |

### Health Check

Railway pings `GET /health` every 30 seconds:

```typescript
// packages/engine/src/server.ts
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

---

## Supabase Configuration

### Project Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize (in packages/db)
supabase init

# Start local development
supabase start

# Apply migrations
supabase db push
```

### Environments

| Environment | Project | Description |
|-------------|---------|-------------|
| Local | `supabase start` | Docker containers, local Postgres |
| Staging | Supabase Cloud (staging project) | Separate project for staging |
| Production | Supabase Cloud (production project) | Separate project, backup enabled |

### Configuration

- **Auth:** Email + Google OAuth enabled. Redirect URLs configured per environment.
- **Realtime:** Enabled for `run_steps` table. Broadcast changes on INSERT, UPDATE.
- **RLS:** Enabled on all tables. Policies applied via migrations.
- **Backups:** Daily automated backups (Pro plan). Point-in-time recovery enabled for production.

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - run: pnpm build
```

### Deployment Flow

```
Developer pushes code
        │
        ├── PR → Vercel creates Preview deployment
        │        GitHub Actions runs lint + type-check + test
        │
        ├── Merge to develop → Vercel deploys to Staging
        │                     Railway deploys staging service
        │
        └── Merge to main → Vercel deploys to Production
                            Railway deploys production service
                            Supabase migrations applied
```

---

## Environment Variable Management

### Vercel

Set via Vercel Dashboard → Settings → Environment Variables. Scoped per environment (Preview, Staging, Production).

### Railway

Set via Railway Dashboard → Service → Variables. Shared variables linked across services.

### Local Development

Copy `.env.example` to `.env.local` in `apps/web/`:

```bash
cp .env.example apps/web/.env.local
# Fill in values from Supabase local dashboard
```

### Secrets Rotation

| Secret | Rotation | Method |
|--------|----------|--------|
| `ANTHROPIC_API_KEY` | Quarterly | Regenerate in Anthropic Console |
| `SUPABASE_SERVICE_ROLE_KEY` | On compromise only | Regenerate in Supabase Dashboard |
| `INNGEST_SIGNING_KEY` | On compromise only | Regenerate in Inngest Dashboard |
| Webhook secrets | Per schedule, on compromise | Regenerate via API |

---

## Rollback Strategy

### Vercel
- **Instant rollback:** Vercel Dashboard → Deployments → select previous → Promote to Production
- **Git revert:** Revert the commit, push to `main`, Vercel auto-deploys

### Railway
- **Re-deploy:** Railway Dashboard → select previous deployment → Redeploy
- **Docker rollback:** Tag images, deploy specific tag

### Supabase (Database)
- **Point-in-time recovery:** Supabase Dashboard → Backups → Restore to specific time
- **Migration rollback:** Each migration has a corresponding `down.sql` script

---

## Monitoring

| Service | Tool | Purpose |
|---------|------|---------|
| Web app uptime | UptimeRobot | Ping every 60s, alert on downtime |
| API performance | Vercel Analytics | Request duration, error rates |
| Railway health | Railway Metrics | CPU, memory, request logs |
| Database | Supabase Dashboard | Query performance, connection pool |
| Errors | Sentry | Client + server error tracking |
| Scheduled runs | Inngest Dashboard | Job success/failure rates |
