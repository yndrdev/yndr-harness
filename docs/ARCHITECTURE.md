# Architecture — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18

---

## System Overview

YNDR Harness is a monorepo platform that converts natural-language process descriptions into executable AI playbooks. The system has two primary data flows:

1. **Build Flow:** User conversation → AI interview → structured YAML playbook
2. **Run Flow:** YAML playbook → Zod validation → RunEngine → Claude API → GuardrailEngine → EventBus → DB/UI

---

## Monorepo Structure

```
yndr-harness/
├── apps/
│   └── web/                      # Next.js 15 — Web application
│       ├── app/                  # App Router
│       │   ├── (dashboard)/      # Authenticated routes
│       │   │   ├── build/        # Build Mode (conversation UI)
│       │   │   ├── playbooks/    # Playbook library
│       │   │   │   └── [id]/     # Playbook detail + run
│       │   │   └── layout.tsx    # Dashboard layout (sidebar + header)
│       │   ├── api/              # API routes (Next.js Route Handlers)
│       │   ├── layout.tsx        # Root layout (providers, fonts)
│       │   └── page.tsx          # Landing / marketing page
│       └── components/           # React components
├── packages/
│   ├── engine/                   # @yndr/engine — Core execution engine
│   ├── cli/                      # @yndr/cli — Command-line interface
│   └── db/                       # @yndr/db — Database types + client
└── harnesses/                    # Example YAML configurations
```

**Package Dependencies:**
```
@yndr/cli ──→ @yndr/engine ──→ @yndr/db
                   ↑
apps/web ──────────┘
```

---

## Engine Architecture

The engine (`packages/engine`) is the core of the platform. It parses, validates, and executes harness configurations.

```
                    ┌────────────────┐
   YAML string ───→│  YAML Parser   │───→ HarnessConfig (validated)
                    │  (js-yaml)     │
                    └────────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │   RunEngine    │ ← orchestrates execution
                    │                │
                    │  for each step:│
                    │    ┌──────────────────┐
                    │    │   StepRunner     │
                    │    │                  │
                    │    │  1. Build prompt  │ ← PromptBuilder
                    │    │  2. Route model   │ ← ModelRouter
                    │    │  3. Call Claude   │ ← Anthropic SDK
                    │    │  4. Check guards  │ ← GuardrailEngine
                    │    │  5. Log result    │ ← ExecutionLog
                    │    │  6. Emit events   │ ← EventBus
                    │    └──────────────────┘
                    │                │
                    └────────────────┘
                           │
                           ▼
                    ┌────────────────┐
                    │   RunResult    │ ← final output
                    └────────────────┘
```

### Core Components

| Component | File | Responsibility |
|-----------|------|----------------|
| **HarnessConfig** | `parser/yaml-parser.ts` | Parse YAML, validate with Zod, build system prompts |
| **RunEngine** | `executor/run-engine.ts` | Orchestrate step execution in dependency order |
| **StepRunner** | `executor/step-runner.ts` | Execute individual steps with Claude API |
| **GuardrailEngine** | `guardrails/engine.ts` | Check outputs against hard stops, warnings, compliance |
| **ModelRouter** | `agents/model-router.ts` | Select Claude model tier based on step complexity |
| **PromptBuilder** | `agents/prompt-builder.ts` | Build prompts for autonomous, interactive, validation steps |
| **EventBus** | `events/event-bus.ts` | Emit lifecycle events for real-time UI updates |
| **ExecutionLog** | `logger/execution-log.ts` | Structured logging of all execution activity |
| **MCPConnector** | `mcp/connector.ts` | Connect to external tools via Model Context Protocol |

---

## Data Flow: Build Mode

```
User opens Build Mode
        │
        ▼
┌──────────────────┐     ┌──────────────────┐
│  ConversationUI  │────→│ POST /api/build/  │
│  (React client)  │     │    message        │
│                  │←────│ (streaming SSE)   │
└──────────────────┘     └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Meta-Harness    │
                         │  (RunEngine      │
                         │   executing the  │
                         │   demo-meta-     │
                         │   harness.yaml)  │
                         └──────────────────┘
                                │
                                ▼
                         ┌──────────────────┐
                         │  Generated YAML  │───→ Zod validation
                         │  playbook        │───→ Save to DB (JSONB)
                         └──────────────────┘
```

Build Mode uses the meta-harness pattern: a harness that interviews the user and generates other harnesses. The `demo-meta-harness.yaml` defines the interview flow, and the RunEngine executes it like any other playbook.

---

## Data Flow: Run Mode

```
User clicks "Run" on a playbook
        │
        ▼
┌──────────────────┐     ┌──────────────────┐
│  POST /api/      │────→│  RunEngine       │
│  playbooks/[id]/ │     │                  │
│  run             │     │  Loads config    │
└──────────────────┘     │  from DB (JSONB) │
                         │                  │
                         │  Validates via   │
                         │  Zod schema      │
                         └──────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Step 1   │ │ Step 2   │ │ Step N   │
              │ (Sonnet) │ │ (Haiku)  │ │ (Sonnet) │
              └──────────┘ └──────────┘ └──────────┘
                    │           │           │
                    ▼           ▼           ▼
              ┌──────────────────────────────────┐
              │       GuardrailEngine            │
              │  hard_stops → HALT if violated   │
              │  soft_warnings → flag + continue │
              │  compliance → always enforced    │
              └──────────────────────────────────┘
                    │
                    ▼
              ┌──────────────────────────────────┐
              │         EventBus                 │
              │  step:start → Supabase Realtime  │
              │  step:complete → UI update       │
              │  guardrail:violation → alert     │
              └──────────────────────────────────┘
                    │
                    ▼
              ┌──────────────────────────────────┐
              │    Database (Supabase)           │
              │  runs table → run record         │
              │  run_steps table → step results  │
              │  execution_logs → audit trail    │
              └──────────────────────────────────┘
```

---

## Web App Architecture

### Next.js 15 App Router

```
app/
├── layout.tsx              # Root: fonts, metadata, providers
├── page.tsx                # Landing page (Server Component)
├── globals.css             # Tailwind base styles
├── (dashboard)/
│   ├── layout.tsx          # Dashboard shell: sidebar, header, auth guard
│   ├── build/
│   │   └── page.tsx        # Build Mode: ConversationUI (Client Component)
│   └── playbooks/
│       ├── page.tsx        # Playbook library (Server Component)
│       └── [id]/
│           ├── page.tsx    # Playbook detail (Server Component)
│           └── run/
│               └── page.tsx # Run view: RunTimeline (Client Component)
└── api/
    ├── playbooks/
    │   ├── route.ts        # GET (list), POST (create)
    │   └── [id]/
    │       ├── route.ts    # GET, PUT, DELETE
    │       └── run/
    │           └── route.ts # POST (start run)
    ├── runs/
    │   ├── route.ts        # GET (list)
    │   └── [id]/
    │       └── route.ts    # GET (detail with steps)
    ├── build/
    │   └── message/
    │       └── route.ts    # POST (Build Mode conversation)
    └── webhooks/
        └── [id]/
            └── route.ts    # POST (scheduled run triggers)
```

### Server vs Client Components

| Pattern | Use Case |
|---------|----------|
| **Server Component** | Playbook list, playbook detail, run history — data fetching, no interactivity |
| **Client Component** | ConversationUI (chat), RunTimeline (real-time), forms — requires `useState`, `useEffect`, event handlers |
| **Server Action** | Playbook CRUD mutations, run initiation — form submissions that modify data |

---

## Real-time Architecture

Supabase Realtime powers live run updates:

```
RunEngine (server)
    │
    ├── EventBus emits step:complete
    │       │
    │       ▼
    │   Update run_steps table via Supabase client
    │       │
    │       ▼
    │   Supabase Realtime broadcasts change
    │       │
    │       ▼
    │   Client subscribed to run_steps WHERE run_id = X
    │       │
    │       ▼
    └── RunTimeline component updates UI
```

**Subscription pattern:**
```typescript
supabase
  .channel(`run:${runId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'run_steps',
    filter: `run_id=eq.${runId}`
  }, (payload) => {
    updateTimeline(payload.new)
  })
  .subscribe()
```

---

## Scheduling Architecture (Inngest)

Inngest provides event-driven scheduling for cron jobs, webhooks, and event chains.

```
┌─────────────────┐
│   Inngest Cloud  │
│                  │
│  Cron Trigger ───┼──→ POST /api/inngest
│  Webhook Event ──┼──→ (Inngest serve handler)
│  Chain Event ────┼──→
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Inngest Function│
│  "run-playbook"  │
│                  │
│  1. Load config  │
│  2. Create run   │
│  3. Start engine │
│  4. Stream events│
└─────────────────┘
```

---

## Long-Running Agents (Railway)

Vercel serverless functions have a 300-second timeout. For complex playbooks with many steps, the engine runs on Railway:

```
Vercel (API route)
    │
    ├── If estimated duration < 300s → execute inline
    │
    └── If estimated duration >= 300s
            │
            ▼
        POST to Railway service
            │
            ▼
        Railway container runs RunEngine
            │
            ▼
        Results stream back via Supabase Realtime
```

**Estimation heuristic:** `step_count * avg_step_duration_ms`. Interactive steps add variable time.

---

## Security Model

- **Authentication:** Supabase Auth (email + OAuth)
- **Authorization:** Row Level Security (RLS) on all tables
- **Tenant Isolation:** Every table has `tenant_id`, every query filtered by tenant
- **API Keys:** Stored in environment variables only, never in database
- **Guardrails:** Three-tier enforcement (hard stops, soft warnings, compliance)
- **Audit Trail:** Every step execution logged in `execution_logs` table

---

## Technology Decision Map

| Decision | Choice | Alternative | Rationale |
|----------|--------|-------------|-----------|
| Monorepo | pnpm + Turborepo | npm workspaces, Nx | Fast installs, proven with Next.js |
| Database | Supabase (PostgreSQL) | Firebase, PlanetScale | Auth + DB + Realtime in one platform |
| Scheduler | Inngest | BullMQ, Temporal | Event-driven, serverless-native, no queue infra |
| Playbook format | YAML (author) / JSONB (store) | JSON-only, DSL | YAML is human-readable, JSONB is queryable |
| Long-running | Railway | AWS Lambda, Modal | Simple container hosting, no cold starts |
| AI SDK | Anthropic Claude SDK | OpenAI, Cohere | Best reasoning, tool use, long context |
