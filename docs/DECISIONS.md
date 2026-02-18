# Architecture Decision Records — YNDR Harness Platform

**Date:** 2026-02-18

---

## ADR-001: pnpm + Turborepo over npm/yarn workspaces

### Context
The Harness platform consists of multiple packages (engine, CLI, DB types) and a web app. We need a monorepo tool that handles dependency management, build caching, and parallel task execution.

### Decision
Use **pnpm workspaces** for package management and **Turborepo** for build orchestration.

### Consequences
- **Positive:** pnpm's content-addressable store reduces disk usage by ~60% vs npm. Strict dependency resolution prevents phantom dependencies. Turborepo's remote caching speeds up CI builds significantly.
- **Positive:** Turborepo is maintained by Vercel and has first-class Next.js integration.
- **Positive:** `turbo run dev --filter=@yndr/engine` allows targeted development.
- **Negative:** Team must use pnpm (not npm/yarn). Slight learning curve for `pnpm-workspace.yaml` and `turbo.json` configuration.

### Alternatives Considered
- **npm workspaces:** Simpler setup but slower installs, no content-addressable store, no build caching.
- **yarn (Berry):** Plug'n'Play mode causes compatibility issues with many packages. Less community adoption.
- **Nx:** More powerful but heavier. Overkill for our package count. Steeper learning curve.

---

## ADR-002: Supabase over Firebase/PlanetScale

### Context
We need a database, authentication system, and real-time pub/sub for live run updates — all with Row Level Security for multi-tenant isolation.

### Decision
Use **Supabase** (managed PostgreSQL) for auth, database, and real-time subscriptions.

### Consequences
- **Positive:** PostgreSQL provides JSONB for storing playbook configs, full-text search, and complex queries that Firestore can't handle.
- **Positive:** Built-in Row Level Security (RLS) enforces tenant isolation at the database level — queries physically cannot return other tenants' data.
- **Positive:** Supabase Realtime enables live `run_steps` updates pushed to the UI without custom WebSocket infrastructure.
- **Positive:** Supabase Auth handles email + OAuth with JWTs that work seamlessly with RLS policies.
- **Positive:** Supabase CLI provides local development with `supabase start`.
- **Negative:** Vendor lock-in to Supabase-specific features (Realtime, Auth helpers). Mitigated by using standard SQL and the PostgREST API.

### Alternatives Considered
- **Firebase (Firestore):** NoSQL doesn't support relational queries we need (joins across runs, steps, playbooks). No row-level security at the DB level. Real-time is powerful but Firestore's pricing model is unpredictable at scale.
- **PlanetScale:** Excellent MySQL hosting but no built-in auth, no real-time subscriptions, no RLS. Would need separate auth (Clerk/Auth.js) and separate real-time (Pusher/Ably).
- **Raw PostgreSQL (Railway):** Full control but requires building auth, real-time, and RLS infrastructure from scratch.

---

## ADR-003: Inngest over BullMQ/Temporal for Scheduling

### Context
Playbooks need to run on schedules (cron), be triggered by webhooks, and chain to other playbooks on completion. We need a job scheduling system.

### Decision
Use **Inngest** for event-driven scheduling and background job execution.

### Consequences
- **Positive:** Inngest is serverless-native — no Redis, no queue infrastructure to manage. Functions deploy alongside our Next.js app.
- **Positive:** Built-in cron scheduling, event triggers, and step functions with automatic retries.
- **Positive:** Event-driven architecture aligns with our EventBus pattern. Inngest events can trigger from `run:complete` engine events.
- **Positive:** Built-in observability dashboard for monitoring scheduled runs.
- **Negative:** Dependency on Inngest's cloud service. Self-hosted option exists but adds operational overhead.
- **Negative:** 10-second step timeout on free tier (upgraded to 15 minutes on paid tier). Long-running steps need Railway fallback.

### Alternatives Considered
- **BullMQ (Redis):** Battle-tested but requires Redis infrastructure. Not serverless-friendly. No built-in cron or event chaining.
- **Temporal:** Enterprise-grade workflow engine but extreme complexity for our use case. Requires dedicated Temporal cluster.
- **Vercel Cron Jobs:** Too limited — only simple cron, no event triggers, no chaining, no retries.
- **AWS Step Functions:** Powerful but AWS-specific, complex state machine DSL, cold starts.

---

## ADR-004: YAML for Playbook Authoring, JSONB for Storage

### Context
Playbook configurations define the AI agent's identity, steps, tools, guardrails, output format, and context. We need a format for authoring and a format for storage.

### Decision
Use **YAML** as the human-facing authoring format and **JSONB** as the database storage format.

### Consequences
- **Positive:** YAML is readable and writable by non-developers. Multi-line strings, comments, and indentation make complex configs approachable.
- **Positive:** JSONB in PostgreSQL supports indexing, partial queries (`config->'harness'->>'name'`), and efficient storage.
- **Positive:** Zod schema validates at the boundary — YAML is parsed by `js-yaml`, then validated by `HarnessConfigSchema.parse()`. Invalid configs are rejected before storage.
- **Positive:** The `yaml_source` column preserves the original YAML (with comments) for editing, while `config` (JSONB) is used for querying.
- **Negative:** Two representations of the same data — must keep `yaml_source` and `config` in sync.
- **Negative:** YAML parsing adds a dependency (`js-yaml`) and a potential attack surface (YAML deserialization). Mitigated by safe loading.

### Alternatives Considered
- **JSON-only:** Technically sufficient but painful for human authoring. No comments, no multi-line strings, too many braces.
- **Custom DSL:** Maximum expressiveness but requires building a parser, editor tooling, syntax highlighting, and documentation from scratch.
- **TOML:** Less popular, less expressive for nested structures, unfamiliar to most users.

---

## ADR-005: Railway for Long-Running Agents vs Vercel Serverless

### Context
Vercel serverless functions timeout at 300 seconds (5 minutes) on the Pro plan. Complex playbooks with many steps, interactive pauses, or slow API calls can easily exceed this limit.

### Decision
Use **Railway** for playbook executions estimated to exceed 300 seconds. Vercel handles short runs inline.

### Consequences
- **Positive:** Railway containers have no timeout — a playbook can run for hours if needed.
- **Positive:** Simple deployment — Railway builds from the same monorepo, runs the engine package directly.
- **Positive:** Results stream back to the web app via Supabase Realtime (same mechanism as inline runs), so the UI doesn't need to know where execution is happening.
- **Negative:** Additional infrastructure to manage (Railway service, health checks, scaling).
- **Negative:** Added latency for the handoff — Vercel must POST to Railway, which starts execution. Adds ~1-2 seconds.

### Alternatives Considered
- **Vercel only (split execution):** Break long playbooks into sub-300s chunks using step functions. Complex, fragile, loses execution context between invocations.
- **AWS Lambda + SQS:** High timeout (15 min) but requires AWS infrastructure. Cold starts affect UX.
- **Modal:** Serverless GPU/CPU containers. Powerful but overkill — we don't need GPU. Adds dependency on another cloud provider.
- **Fly.io:** Similar to Railway. Slightly more complex setup (Dockerfile required). Railway's template-based deploys are simpler for our use case.

---

## ADR-006: Claude Agent SDK for Autonomous Execution

### Context
The engine needs to call Claude API for each step, handle tool use, manage conversation context, and support streaming responses. We need an SDK strategy.

### Decision
Use the **Anthropic Claude SDK** (`@anthropic-ai/sdk`) directly for all AI operations.

### Consequences
- **Positive:** Direct SDK usage gives full control over prompts, system messages, tool definitions, and streaming.
- **Positive:** Model routing (`resolveModel()`) selects Opus/Sonnet/Haiku per step, optimizing cost and quality.
- **Positive:** No abstraction layer between our engine and Claude — easier to debug, profile, and optimize.
- **Positive:** When Claude Agent SDK features are needed (multi-turn tool use, extended thinking), we can adopt them incrementally.
- **Negative:** More code to write vs using a framework like LangChain or Vercel AI SDK. We build our own prompt management, streaming, and retry logic.

### Alternatives Considered
- **Vercel AI SDK:** Good abstraction for streaming but adds indirection. We need fine-grained control over system prompts and guardrail injection that the AI SDK's middleware doesn't fully support.
- **LangChain (TypeScript):** Heavy abstraction with poor TypeScript types. Chain/Agent paradigm doesn't map well to our step-based execution model.
- **CrewAI:** Python-only. Not applicable for our TypeScript monorepo.
- **OpenAI SDK:** Claude's reasoning and instruction-following is superior for SOP execution. Claude handles longer contexts better for multi-step playbooks.
