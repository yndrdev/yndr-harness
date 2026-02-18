# CLAUDE.md — YNDR Harness Platform

> This file is the operating manual for AI agents working on this project.
> Read it fully before every session. Follow it exactly.

---

## Project

**Name:** YNDR Harness Platform
**What:** AI-powered SOP execution platform — Build playbooks from conversation, run them autonomously
**Who:** Non-technical business operators, agencies, enterprise teams
**Why:** No product exists that lets a non-technical person describe a process and have AI execute it with guardrails
**Status:** Section 1 — Kickoff & Discovery

---

## Two Modes

- **Build Mode** — Claude interviews you about a process, generates a playbook config (YAML)
- **Run Mode** — Anyone picks a playbook, hits run, AI executes it autonomously with guardrails

**Formula:** What Time → Events → Agents → State → Loop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Framework | Next.js 15 (App Router) |
| Auth + DB + Realtime | Supabase |
| AI | Anthropic Claude SDK |
| Build System | pnpm workspaces + Turborepo |
| Styling | Tailwind CSS + shadcn/ui |
| Scheduler | Inngest (event-driven) |
| Hosting | Vercel (web) + Railway (long-running agents) |

**Package Manager:** pnpm (v9.15+)
**Node Version:** >=20.0.0

---

## File Structure

```
yndr-harness/
├── apps/
│   └── web/                    # Next.js 15 web app
│       ├── app/
│       │   ├── (dashboard)/    # Authenticated routes
│       │   │   ├── build/      # Build Mode — conversation UI
│       │   │   ├── playbooks/  # Playbook library + detail + run
│       │   │   └── layout.tsx  # Dashboard shell
│       │   ├── layout.tsx      # Root layout
│       │   ├── page.tsx        # Landing page
│       │   └── globals.css     # Tailwind globals
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── engine/                 # @yndr/engine — Core execution engine
│   │   └── src/
│   │       ├── types/          # Zod schemas + TypeScript types
│   │       ├── parser/         # YAML parser + validator
│   │       ├── executor/       # RunEngine + StepRunner
│   │       ├── guardrails/     # GuardrailEngine
│   │       ├── agents/         # Model router + prompt builder
│   │       ├── events/         # EventBus for lifecycle events
│   │       ├── logger/         # ExecutionLog
│   │       ├── mcp/            # MCP connector
│   │       └── index.ts        # Public API exports
│   ├── cli/                    # @yndr/cli — CLI runner
│   └── db/                     # @yndr/db — Database types + client
│       └── src/schema/         # Table types + Supabase type map
├── harnesses/                  # Example harness YAML configs
│   ├── client-onboarding.yaml
│   └── demo-meta-harness.yaml
├── docs/                       # Project documentation
├── reports/                    # Generated reports
├── screenshots/                # Visual verification
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── turbo.json                  # Turborepo pipeline
├── tsconfig.base.json          # Shared TypeScript config
├── .env.example                # Environment variable template
├── CLAUDE.md                   # This file
└── SOP.md                      # Master project checklist
```

---

## Commands

```bash
# Development
pnpm dev                                    # Start all packages in dev mode
pnpm build                                  # Build all packages
pnpm lint                                   # Lint all packages
pnpm type-check                             # TypeScript type checking
pnpm test                                   # Run all tests
pnpm format                                 # Format with Prettier

# Targeted builds
turbo run dev --filter=@yndr/engine         # Dev only engine
turbo run dev --filter=web                  # Dev only web app
turbo run build --filter=@yndr/engine       # Build only engine

# Clean
pnpm clean                                 # Clean all dist/ and .next/
```

---

## Coding Conventions

### TypeScript
- **Strict mode** always — no `any`, no `@ts-ignore`
- **ESM modules** — use `.js` extension in imports (even for `.ts` files)
- **Zod** for all runtime validation — schemas define types, not interfaces
- **Type inference** — prefer `z.infer<typeof Schema>` over manual interfaces
- **No enums** — use `as const` objects or union types

### File Naming
- **kebab-case** for all files: `run-engine.ts`, `yaml-parser.ts`
- **PascalCase** for React components: `PlaybookCard.tsx`, `RunTimeline.tsx`
- **snake_case** for harness step IDs: `deep_dive`, `tech_assessment`

### Code Style
- **No default exports** — use named exports everywhere
- **Explicit return types** on public functions
- **Barrel exports** via `index.ts` in each package
- **Prefer `const` assertions** for configuration objects
- **Error handling** — use Result types or throw with descriptive messages, never swallow errors

### React / Next.js
- **Server Components** by default — only add `"use client"` when needed
- **Server Actions** for mutations — no API routes for internal operations
- **Colocate** styles, tests, and types with their components
- **shadcn/ui** components — don't build custom when shadcn has it

### Git
- **Conventional commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- **Branch naming:** `feature/`, `fix/`, `docs/`, `refactor/`
- **Never** commit `.env`, secrets, or `node_modules`

---

## Environment Variables

```bash
# Required — AI
ANTHROPIC_API_KEY=sk-ant-xxx                # Claude API key

# Required — Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # Public anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...            # Server-only, never expose to client

# Optional — Scheduler
INNGEST_EVENT_KEY=                          # Inngest event key
INNGEST_SIGNING_KEY=                        # Inngest webhook signing
```

---

## Key Types

The engine is built on Zod schemas. Key types to know:

- `HarnessConfigRaw` — Full harness YAML structure
- `Step` — Single step in a harness (interactive / autonomous / validation)
- `Guardrails` — Hard stops, soft warnings, compliance rules
- `RunResult` — Output of a complete harness execution
- `StepResult` — Output of a single step execution
- `ModelTier` — `"opus" | "sonnet" | "haiku"` for model routing

---

## Architecture Notes

- **Parser** (`yaml-parser.ts`) validates YAML → Zod → `HarnessConfig` class
- **RunEngine** orchestrates steps in dependency order with event emission
- **GuardrailEngine** checks responses against hard stops / warnings deterministically
- **ModelRouter** auto-selects Claude model tier based on step complexity
- **EventBus** enables real-time streaming to web UI via Supabase Realtime
- **StepRunner** handles individual step execution with Claude API calls

---

## Don'ts

- Don't use `npm` or `yarn` — this project uses `pnpm`
- Don't add `"use client"` to components that don't need interactivity
- Don't write raw SQL — use Supabase client with typed schemas
- Don't hardcode model IDs — use the model router
- Don't skip guardrail checks — every step output must pass through GuardrailEngine
- Don't store API keys in the database — use environment variables
