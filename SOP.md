# YNDR SOP — Harness Platform Master Checklist

> Customized from the YNDR Agency SOP Template.
> Work section by section. Never skip ahead past a phase gate.

---

## Project: YNDR Harness Platform
**Created:** 2026-02-18
**Current Phase:** Section 1 — Kickoff & Discovery
**Overall Progress:** 3/120 tasks

---

## Section 1: Kickoff & Discovery
> Complete ALL tasks below before proceeding to Section 2

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [x] | Create project repo & workspace | Human | - | Monorepo with pnpm + Turborepo |
| [ ] | Create shared folders (Google Drive / assets) | Human | - | Logo files, brand assets, content |
| [ ] | Send kickoff communication to stakeholders | Human | - | Intro email, Slack channel |
| [ ] | Stakeholder discovery session | Human | - | Record meeting, capture requirements |
| [ ] | Harness concept definition (Build Mode + Run Mode) | Claude (Opus) | docs/PRD.md | Core product formula |
| [ ] | Playbook schema specification (YAML format + Zod validation) | Claude (Opus) | docs/ARCHITECTURE.md | Six components: identity, tools, steps, guardrails, output, context |
| [ ] | Market validation — competitors + TAM analysis | Claude (Research) | docs/MARKET-ANALYSIS.md | Manus, OpenClaw, Zapier gap analysis |
| [ ] | Paste/capture all project context (briefs, transcripts, notes) | Human | - | Raw input for doc generation |
| [ ] | Write PRD with user stories & acceptance criteria | Claude (Opus) | docs/PRD.md | From discovery + context |
| [ ] | Define user personas (Agency Owner, Ops Manager, Developer) | Claude (Opus) | docs/PRD.md | Section within PRD |
| [ ] | Create information architecture / app sitemap | Claude (Opus) | docs/ARCHITECTURE.md | Page/screen map |
| [ ] | Define data model (entities, relationships) | Claude (Opus) | docs/DATABASE.md | Initial schema design |
| [ ] | Collect brand assets (logos, fonts, colors, design direction) | Human | - | Red #E94560, Blue #0F3460, Dark #1A1A2E |
| [x] | Create CLAUDE.md with project context & conventions | Claude (Opus) | CLAUDE.md | Operating rules + stack |
| [x] | Create initial SOP.md (this file) with project-specific tasks | Claude (Opus) | SOP.md | Customize from template |
| [ ] | Market research & competitor analysis | Claude (Research) | docs/MARKET-ANALYSIS.md | Top 3-5 competitors |
| [ ] | Client review & sign-off on PRD | Human | docs/PRD.md | Approval required |
| [ ] | **TEST:** Verify all docs exist and are non-empty | Claude | docs/TEST-SUMMARY.md | Automated file check |
| [ ] | **TEST:** Screenshot project structure as proof | Claude (/chrome) | screenshots/ | Visual verification |

> **PHASE GATE:** PRD.md signed off. CLAUDE.md complete. Market analysis done. All Section 1 tasks [x]. Tests pass.

---

## Section 2: Architecture & Design
> Complete ALL tasks below before proceeding to Section 3

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Create ARCHITECTURE.md (system design, data flow, integrations) | Claude (Opus) | docs/ARCHITECTURE.md | Full system blueprint |
| [ ] | Create DATABASE.md (schema, relationships, RLS, indexes) | Claude (Opus) | docs/DATABASE.md | Complete schema with SQL |
| [ ] | Create API.md (endpoints, auth, payloads, responses) | Claude (Opus) | docs/API.md | RESTful spec |
| [ ] | Create DECISIONS.md (tech stack choices + WHY) | Claude (Opus) | docs/DECISIONS.md | ADRs with rationale |
| [ ] | Create COMPONENTS.md (design system, tokens, component lib) | Claude (Opus) | docs/COMPONENTS.md | Colors, typography, spacing |
| [ ] | Create DEPLOYMENT.md (environments, CI/CD, rollback) | Claude (Opus) | docs/DEPLOYMENT.md | Staging + production |
| [ ] | Create COMPLIANCE.md (security, API key handling, RLS) | Claude (Opus) | docs/COMPLIANCE.md | Guardrail enforcement |
| [ ] | Low-fidelity wireframes / mockups | Human/Designer | - | Figma, Whimsical, or v0 |
| [ ] | Design review with stakeholder | Human | - | Present wireframes |
| [ ] | Revisions per client feedback | Human/Designer | - | Iterate on designs |
| [ ] | High-fidelity mockups / prototype | Human/Designer | - | Final visual design |
| [ ] | Final design approval & asset handoff | Human | - | Approved designs → dev |
| [ ] | Create AGENT-BEHAVIOR.md (orchestration config) | Claude (Opus) | docs/AGENT-BEHAVIOR.md | Model routing + swarm configs |
| [ ] | Client project status update | Human | - | Communication checkpoint |
| [ ] | **TEST:** Verify all /docs files created with correct structure | Claude | docs/TEST-SUMMARY.md | Automated doc check |
| [ ] | **TEST:** Validate database schema against ARCHITECTURE.md | Claude | docs/TEST-SUMMARY.md | Cross-reference check |
| [ ] | **TEST:** Cross-reference API.md endpoints with PRD user stories | Claude | docs/TEST-SUMMARY.md | Coverage check |
| [ ] | Append results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Section 2 results |

> **PHASE GATE:** All docs complete. Architecture reviewed. Designs approved. Tests pass. All Section 2 tasks [x].

---

## Section 3: Development

### Sprint 0 — Monorepo Scaffold, Supabase, Auth

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Project scaffolding (pnpm workspaces, Turborepo, TypeScript strict) | Claude (Sonnet) | docs/ARCHITECTURE.md | Monorepo foundation |
| [ ] | Configure linting, formatting, TypeScript strict mode | Claude (Haiku) | CLAUDE.md | ESLint, Prettier, tsconfig |
| [ ] | Setup version control & branching strategy | Claude (Haiku) | - | main, develop, feature/* |
| [ ] | Supabase project setup (local + cloud) | Claude (Sonnet) | docs/DATABASE.md | Auth, DB, Realtime |
| [ ] | Authentication & authorization setup (Supabase Auth) | Claude (Sonnet) | docs/ARCHITECTURE.md | Email/OAuth, RLS middleware |
| [ ] | Database migrations (foundation tables) | Claude (Sonnet) | docs/DATABASE.md | tenants, profiles, playbooks, runs |
| [ ] | Seed data for development | Claude (Haiku) | docs/DATABASE.md | Test users, sample playbooks |
| [ ] | Deploy staging environment (Vercel + Supabase) | Claude (Sonnet) | docs/DEPLOYMENT.md | Staging URLs |
| [ ] | **TEST:** Verify app loads at localhost | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | **TEST:** Test login/auth flow end-to-end | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | **TEST:** Verify DB connection (read data from page) | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Sprint 0 results |

> **SPRINT 0 GATE:** App runs locally. Auth works. DB connected. Staging deployed. Tests pass.

### Sprint 1 — Engine Port + Build Mode

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Sprint planning (pull tasks from PRD) | Claude (Opus) | docs/PRD.md | Define sprint scope |
| [ ] | Port YAML parser + Zod validation to @yndr/engine | Claude (Sonnet) | packages/engine | HarnessConfig class |
| [ ] | Port RunEngine + StepRunner | Claude (Sonnet) | packages/engine | Core execution loop |
| [ ] | Port GuardrailEngine (deterministic checks) | Claude (Sonnet) | packages/engine | Hard stops + warnings |
| [ ] | Port ModelRouter (Opus/Sonnet/Haiku routing) | Claude (Sonnet) | packages/engine | Smart model selection |
| [ ] | Build Mode conversation UI (chat interface) | Claude (Sonnet) | apps/web | ConversationUI component |
| [ ] | Build Mode API (POST /api/build/message) | Claude (Sonnet) | docs/API.md | Streaming responses |
| [ ] | Build Mode → YAML generation (meta-harness integration) | Claude (Sonnet) | apps/web | Conversation → playbook |
| [ ] | Playbook CRUD API endpoints | Claude (Sonnet) | docs/API.md | Create, read, update, delete |
| [ ] | Playbook library UI (list + detail views) | Claude (Sonnet) | apps/web | PlaybookCard component |
| [ ] | Code review & cleanup | Claude (Opus) | - | Architecture compliance |
| [ ] | **TEST:** Test Build Mode conversation flow | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | **TEST:** Test playbook CRUD operations | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Sprint 1 results |

> **SPRINT 1 GATE:** Engine ported. Build Mode works. Playbook CRUD works. Tests green.

### Sprint 2 — Run Mode + Live Timeline

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Sprint planning | Claude (Opus) | docs/PRD.md | Define sprint scope |
| [ ] | Run initiation API (POST /api/playbooks/[id]/run) | Claude (Sonnet) | docs/API.md | Start a run |
| [ ] | Real-time step execution with Supabase Realtime | Claude (Sonnet) | apps/web | Live updates to UI |
| [ ] | RunTimeline component (live step-by-step progress) | Claude (Sonnet) | apps/web | Visual execution timeline |
| [ ] | StepDiagram component (dependency visualization) | Claude (Sonnet) | apps/web | DAG visualization |
| [ ] | GuardrailBadge + StatusIndicator components | Claude (Sonnet) | apps/web | Visual guardrail status |
| [ ] | Run history UI (list past runs with results) | Claude (Sonnet) | apps/web | GET /api/runs |
| [ ] | Error handling & loading states | Claude (Haiku) | - | Skeletons, error boundaries |
| [ ] | Code review & cleanup | Claude (Opus) | - | Architecture compliance |
| [ ] | **TEST:** Test Run Mode execution | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | **TEST:** Test real-time timeline updates | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Sprint 2 results |

> **SPRINT 2 GATE:** Run Mode works. Timeline updates in real-time. Guardrails enforced. Tests green.

### Sprint 3 — CLI + Guardrails + Model Routing

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Sprint planning | Claude (Opus) | docs/PRD.md | Define sprint scope |
| [ ] | CLI scaffold with Commander.js | Claude (Sonnet) | packages/cli | `yndr run`, `yndr build`, `yndr list` |
| [ ] | CLI → RunEngine integration | Claude (Sonnet) | packages/cli | Run harnesses from terminal |
| [ ] | Enhanced guardrail engine (AI classification via Haiku) | Claude (Sonnet) | packages/engine | Semantic rule checking |
| [ ] | Model routing refinement (cost optimization) | Claude (Sonnet) | packages/engine | Token budget enforcement |
| [ ] | Responsive design (mobile-first) | Claude (Haiku) | docs/COMPONENTS.md | 375px → 1440px |
| [ ] | Code review & cleanup | Claude (Opus) | - | Architecture compliance |
| [ ] | **TEST:** Test CLI commands | Claude | docs/TEST-SUMMARY.md | Terminal output capture |
| [ ] | **TEST:** Test guardrail enforcement | Claude | docs/TEST-SUMMARY.md | Violation detection |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Sprint 3 results |

> **SPRINT 3 GATE:** CLI works. Guardrails enhanced. Model routing optimized. Tests green.

### Sprint 4 — MCP + Inngest Scheduler

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Sprint planning | Claude (Opus) | docs/PRD.md | Define sprint scope |
| [ ] | MCP connector implementation | Claude (Sonnet) | packages/engine | External tool integration |
| [ ] | Inngest event functions (cron, webhook, event chain) | Claude (Sonnet) | apps/web | Scheduled runs |
| [ ] | Schedule management UI | Claude (Sonnet) | apps/web | Create/edit/toggle schedules |
| [ ] | Webhook endpoint (POST /api/webhooks/[id]) | Claude (Sonnet) | docs/API.md | External triggers |
| [ ] | Railway deployment for long-running agents | Claude (Sonnet) | docs/DEPLOYMENT.md | >300s execution |
| [ ] | Code review & cleanup | Claude (Opus) | - | Architecture compliance |
| [ ] | **TEST:** Test scheduled runs | Claude (/chrome) | docs/TEST-SUMMARY.md | Cron + webhook tests |
| [ ] | **TEST:** Test MCP tool connectivity | Claude | docs/TEST-SUMMARY.md | External tool tests |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Sprint 4 results |

> **SPRINT 4 GATE:** Scheduling works. MCP connected. Railway deployed. Tests green.

### Sprint Final — Polish & Integration

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Third-party integrations (email, Slack, etc.) | Claude (Sonnet) | docs/ARCHITECTURE.md | Via MCP connectors |
| [ ] | Performance optimization (bundle, queries, streaming) | Claude (Sonnet) | - | Core Web Vitals |
| [ ] | Dark mode refinement | Claude (Haiku) | docs/COMPONENTS.md | Consistent theming |
| [ ] | Error boundaries and fallback states | Claude (Haiku) | - | Graceful degradation |
| [ ] | **TEST:** Verify all integrations work | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot proof |
| [ ] | **TEST:** Lighthouse performance audit | Claude (/chrome) | docs/TEST-SUMMARY.md | Score capture |
| [ ] | Append test results to docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | Final sprint results |

> **SECTION 3 GATE:** All PRD features implemented. All sprint gates passed. Tests green.

---

## Section 4: QA & Testing
> Complete ALL tasks below before proceeding to Section 5

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | **TEST:** Full functional test — every user flow E2E | Claude (/chrome) | docs/TEST-SUMMARY.md | Walk all PRD flows |
| [ ] | **TEST:** Cross-browser (Chrome, Safari, Firefox) | Claude (/chrome) | docs/TEST-SUMMARY.md | Viewport emulation |
| [ ] | **TEST:** Mobile responsive (375px, 768px, 1024px, 1440px) | Claude (/chrome) | docs/TEST-SUMMARY.md | Screenshot each |
| [ ] | **TEST:** Performance — Lighthouse audit all pages | Claude (/chrome) | docs/TEST-SUMMARY.md | Score >= 90 target |
| [ ] | **TEST:** Security — auth flows, API keys, XSS, CSRF | Claude (Sonnet) | docs/TEST-SUMMARY.md | OWASP Top 10 |
| [ ] | **TEST:** Accessibility — WCAG 2.1 AA compliance | Claude (Haiku) | docs/TEST-SUMMARY.md | Contrast, labels, keyboard |
| [ ] | **TEST:** API testing — hit every endpoint, verify responses | Claude (Sonnet) | docs/TEST-SUMMARY.md | Match API.md spec |
| [ ] | **TEST:** Database integrity — relationships, RLS policies | Claude (Sonnet) | docs/TEST-SUMMARY.md | Match DATABASE.md |
| [ ] | **TEST:** Screenshot every test result | Claude (/chrome) | screenshots/ | Visual proof |
| [ ] | Backup codebase (tag release candidate) | Claude (Haiku) | - | git tag rc-v1.0 |
| [ ] | Create comprehensive QA report | Claude (Sonnet) | docs/QA-REPORT.md | All findings |
| [ ] | Fix critical/high bugs | Claude (Sonnet) | - | Priority fixes only |
| [ ] | Re-test fixed bugs | Claude (/chrome) | docs/TEST-SUMMARY.md | Regression check |
| [ ] | Compile final docs/TEST-SUMMARY.md | Claude | docs/TEST-SUMMARY.md | All screenshots + results |
| [ ] | Client QA sign-off | Human | - | Approval to launch |

> **PHASE GATE:** All critical/high bugs resolved. QA report clean. Client approved. All tests pass.

---

## Section 5: Launch & Deployment
> Complete ALL tasks below to close the project

| Status | Task | Owner | Doc | Notes |
|--------|------|-------|-----|-------|
| [ ] | Update metadata (titles, descriptions, OG images) | Claude (Haiku) | - | SEO fundamentals |
| [ ] | Setup analytics (Mixpanel or PostHog) | Claude (Sonnet) | docs/DEPLOYMENT.md | Tracking plan |
| [ ] | Setup error tracking (Sentry) | Claude (Sonnet) | docs/DEPLOYMENT.md | Error monitoring |
| [ ] | SEO configuration (sitemap, robots.txt, structured data) | Claude (Haiku) | - | Technical SEO |
| [ ] | Configure production environment variables | Claude (Sonnet) | docs/DEPLOYMENT.md | Secrets management |
| [ ] | Setup monitoring (uptime, performance alerts) | Claude (Sonnet) | docs/DEPLOYMENT.md | UptimeRobot, Vercel |
| [ ] | Remove dev/debug artifacts | Claude (Haiku) | - | console.logs, test pages |
| [ ] | Clean unused code, styles, dependencies | Claude (Haiku) | - | Tree-shake, audit |
| [ ] | Final QA pass on production URL | Claude (/chrome) | docs/TEST-SUMMARY.md | Production smoke test |
| [ ] | Setup hosting & connect domain | Human | docs/DEPLOYMENT.md | DNS, domain registrar |
| [ ] | SSL certificates & security headers | Claude (Sonnet) | docs/DEPLOYMENT.md | HTTPS, CSP, HSTS |
| [ ] | DNS propagation check | Claude (Haiku) | - | Verify domain resolves |
| [ ] | Launch | Human | - | Go live |
| [ ] | Post-launch monitoring (24/48 hour watch) | Human/Claude | - | Error rates, performance |
| [ ] | Send client launch guide / documentation | Human | - | User manual, FAQ |
| [ ] | Client training session | Human | - | Walkthrough call |
| [ ] | Create portfolio entry / case study | Human | - | Marketing asset |
| [ ] | Archive project assets to Drive | Human | - | Final backup |
| [ ] | Final client project update | Human | - | Handoff complete |
| [ ] | Internal retrospective | Human | docs/DECISIONS.md | Lessons learned |
| [ ] | **PROJECT COMPLETE** | - | - | All sections done |

> **PROJECT COMPLETE:** All 5 sections done. Project delivered. Assets archived.

---

## How to Use This SOP

1. **Work section by section** — never skip ahead past a phase gate
2. **Mark tasks** as you go: `[x]` done, `[ ]` todo, `[~]` partial
3. **Run** `/yndrsop status` to check progress anytime
4. **Run** `/yndrsop next` to execute the next task
5. **Run** `/yndrsop section` to loop through the current section
