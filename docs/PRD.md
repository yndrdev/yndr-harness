# Product Requirements Document — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18
**Author:** YNDR Agency
**Status:** Draft — Pending Stakeholder Sign-off

---

## Vision

**What Shopify did for e-commerce, Harness does for business processes.**

Every business has SOPs — documented or tribal. Today, executing those processes requires humans following checklists, forwarding emails, updating spreadsheets, and hoping nothing slips through the cracks. YNDR Harness lets anyone describe a process in plain English and have AI execute it autonomously — with guardrails to ensure it stays on track.

---

## Problem Statement

1. **Non-technical operators** can't use existing AI agent tools (LangChain, CrewAI, AutoGPT) — they require code
2. **SOPs decay** — written once, followed inconsistently, never improved
3. **Workflow tools** (Zapier, Make) automate triggers but can't reason, adapt, or handle ambiguity
4. **Enterprise AI adoption** stalls because there's no safe, auditable way to let AI execute multi-step processes

---

## User Personas

### 1. Agency Owner — "Jordan" (Primary)
- **Who:** Non-technical. Runs a 5-20 person agency (marketing, consulting, recruiting)
- **Pain:** Spends 40% of time on repetitive operational tasks. Has documented SOPs but nobody follows them consistently
- **Goal:** Describe a client onboarding process once, have AI run it every time a new client signs up
- **Tech comfort:** Uses Slack, Google Workspace, Notion. Cannot write code. Familiar with ChatGPT
- **Success metric:** Saves 10+ hours/week on operational processes

### 2. Operations Manager — "Alex" (Secondary)
- **Who:** Semi-technical. Works at a mid-market company (50-500 employees)
- **Pain:** Manages compliance-heavy processes (onboarding, auditing, reporting). Needs audit trails
- **Goal:** Automate repeatable compliance workflows with guardrails that prevent violations
- **Tech comfort:** Can use spreadsheets, basic automations. Not a developer
- **Success metric:** Zero compliance violations, 50% reduction in process time

### 3. Developer — "Sam" (Power User)
- **Who:** Technical. Builds internal tools for their company or clients
- **Pain:** Keeps rebuilding the same AI agent scaffolding for each project. No reusable framework
- **Goal:** Define playbooks in YAML, execute them via CLI or API, integrate with existing systems via MCP
- **Tech comfort:** Writes TypeScript, uses the terminal, deploys to Vercel
- **Success metric:** Ship AI-powered workflows in hours, not weeks

---

## Core Features

### Feature 1: Build Mode (Conversation → Playbook)

**Description:** A guided conversation interface where the user describes their business process. The AI interviews them step by step and generates a complete playbook configuration (YAML).

**User Flow:**
1. User clicks "Build New Playbook"
2. AI Trail Guide asks: "What process do you want to automate?"
3. User describes in plain English
4. AI asks follow-up questions (tools used, decision points, rules, edge cases)
5. AI organizes everything and presents it back for confirmation
6. User approves → AI generates the YAML config
7. Playbook is saved to the user's library

**Acceptance Criteria:**
- [ ] Chat interface renders messages in real-time (streaming)
- [ ] AI asks one question at a time, acknowledges answers
- [ ] AI mirrors user's language (no jargon swapping)
- [ ] Generated playbook includes all six components (identity, tools, steps, guardrails, output, context)
- [ ] Generated YAML validates against the HarnessConfigSchema (Zod)
- [ ] User can review and edit the generated playbook before saving
- [ ] Conversation history is preserved if the user navigates away and returns

### Feature 2: Run Mode (Execute with Guardrails)

**Description:** Select any playbook from the library and execute it. AI runs each step autonomously, enforcing guardrails in real-time, with a live timeline showing progress.

**User Flow:**
1. User selects a playbook from the library
2. User clicks "Run" and optionally provides initial inputs
3. Engine executes steps in dependency order
4. Live timeline shows each step: pending → running → completed/failed/blocked
5. Guardrail violations halt execution and alert the user
6. On completion, user sees the full run summary with outputs

**Acceptance Criteria:**
- [ ] Steps execute in correct dependency order (DAG resolution)
- [ ] Each step output passes through GuardrailEngine before proceeding
- [ ] Hard stop violations immediately halt execution with a clear explanation
- [ ] Soft warnings display in the UI but allow continuation
- [ ] Live timeline updates in real-time via Supabase Realtime
- [ ] Run history is persisted with full step results and token usage
- [ ] Model routing selects appropriate Claude tier per step type
- [ ] Interactive steps pause execution and prompt the user for input

### Feature 3: Playbook Library (CRUD + Versioning)

**Description:** A dashboard of all playbooks with create, read, update, delete operations. Each edit creates a new version, preserving history.

**Acceptance Criteria:**
- [ ] List view shows all playbooks with name, description, step count, status
- [ ] Detail view shows full playbook config with visual step diagram
- [ ] Edit mode allows modifying YAML or using a visual editor
- [ ] Each save creates a new version (immutable history)
- [ ] Playbooks can be archived (soft delete) or permanently deleted
- [ ] Playbooks are scoped to the tenant (multi-tenant via RLS)
- [ ] Search and filter by name, status, tag

### Feature 4: Live Run Timeline

**Description:** A visual component showing the real-time execution of a playbook run. Each step is displayed as a node with status indicators, model info, token usage, and guardrail results.

**Acceptance Criteria:**
- [ ] Steps render as a vertical timeline with status colors
- [ ] Running steps show a pulsing indicator
- [ ] Completed steps show output preview and duration
- [ ] Blocked steps show the guardrail violation that caused the halt
- [ ] Dependency arrows show the DAG structure
- [ ] Token usage and model tier are visible per step
- [ ] User can expand any step to see full output

### Feature 5: Scheduling (Cron / Webhook / Event Chain)

**Description:** Playbooks can be triggered on a schedule (cron), via webhook (external event), or chained to run after another playbook completes.

**Acceptance Criteria:**
- [ ] Cron expressions are validated and displayed in human-readable format
- [ ] Webhook URLs are generated with unique secrets per schedule
- [ ] Event chains link playbooks: Playbook A completion triggers Playbook B
- [ ] Schedules can be enabled/disabled without deletion
- [ ] Run history tracks the trigger source (manual, cron, webhook, chain)
- [ ] Inngest handles all scheduling backend logic

---

## MVP Scope

### In MVP (v1.0)
- Build Mode (conversation → playbook generation)
- Run Mode (autonomous execution with guardrails)
- Playbook Library (CRUD, versioning)
- Live Run Timeline (real-time step progress)
- Model Routing (Opus/Sonnet/Haiku per step)
- CLI for developers (`yndr run`, `yndr build`, `yndr list`)
- Multi-tenant auth (Supabase Auth)
- Dark mode UI

### Post-MVP (v1.x)
- Scheduling (cron, webhook, event chain) via Inngest
- MCP tool integrations (Slack, email, databases)
- Playbook marketplace / sharing
- Team collaboration (shared playbooks, role-based access)
- Analytics dashboard (run stats, cost tracking, success rates)
- Visual playbook editor (drag-and-drop step builder)
- Mobile app
- White-label / self-hosted option
- SOC 2 certification

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Build-to-run conversion | >60% | % of built playbooks that get run at least once |
| Run completion rate | >85% | % of runs that complete without failure |
| Guardrail halt rate | <5% | % of runs halted by hard stops |
| Time to first playbook | <15 min | Time from signup to first playbook created |
| Weekly active playbooks | >3/user | Average playbooks run per user per week |

---

## Non-Functional Requirements

- **Performance:** Page loads < 2s, step execution feedback < 500ms
- **Availability:** 99.9% uptime for web app
- **Security:** All data encrypted in transit (TLS 1.3) and at rest. No API keys stored in database
- **Scalability:** Support 10,000 concurrent runs (via Railway for long-running agents)
- **Accessibility:** WCAG 2.1 AA compliance
- **Audit:** All run executions logged with timestamps, model used, tokens consumed
