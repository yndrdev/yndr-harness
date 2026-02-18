# Security & Compliance — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18

---

## Overview

The YNDR Harness Platform handles sensitive business processes, API keys for AI execution, and potentially regulated data. This document defines the security controls, compliance requirements, and data protection measures.

---

## API Key Handling

### Principle: API Keys Never Touch the Database

The `ANTHROPIC_API_KEY` is the most sensitive credential in the system. It grants access to Claude API and is billed per token.

**Rules:**
1. API keys are stored **only** in environment variables (Vercel, Railway)
2. API keys are **never** stored in the database, logs, or client-side code
3. API keys are **never** included in API responses
4. The `GuardrailEngine` actively detects and blocks API key patterns in step outputs

**Detection pattern (from `guardrails/engine.ts`):**
```typescript
// Blocks responses containing patterns like:
// sk-ant-xxxx (Anthropic keys)
// eyJxxxx (JWT tokens)
// Any 20+ char alphanumeric string prefixed with a provider identifier
if (/sk-[a-zA-Z0-9]{20,}/.test(text)) return true;
if (/eyJ[a-zA-Z0-9_-]{10,}/.test(text)) return true;
```

### Tenant API Keys (Future)

When tenants bring their own API keys:
- Keys are encrypted at rest using AES-256 before storage
- Keys are decrypted only in memory, only during step execution
- Encryption key is stored in a separate secrets manager (not the database)
- Access to encrypted keys is audit-logged

---

## Tenant Isolation

### Row Level Security (RLS)

Every table with business data has a `tenant_id` column. PostgreSQL RLS policies enforce that:
- Users can **only** read rows where `tenant_id` matches their own tenant
- Users can **only** insert rows with their own `tenant_id`
- These policies are enforced at the **database level**, not the application level

```sql
-- This query physically cannot return other tenants' playbooks
SELECT * FROM playbooks;
-- RLS policy adds: WHERE tenant_id = get_user_tenant_id()
```

### Defense in Depth

Even with RLS, the application layer adds checks:
1. **Middleware:** Auth middleware verifies JWT and extracts `tenant_id`
2. **API layer:** All queries include explicit `tenant_id` filter
3. **Engine:** RunEngine receives only the playbook config, not the tenant context

### Cross-Tenant Prevention

| Layer | Check | Prevents |
|-------|-------|----------|
| Database (RLS) | `tenant_id = get_user_tenant_id()` | Direct data access across tenants |
| API middleware | JWT validation + tenant extraction | Unauthenticated access |
| Application | Explicit `tenant_id` in queries | IDOR (Insecure Direct Object Reference) |
| Guardrails | Content scanning | Leaking data between playbook runs |

---

## Guardrail Enforcement

The three-tier guardrail system provides runtime safety during playbook execution.

### Tier 1: Hard Stops

Hard stops immediately halt execution and alert the user. They protect against:

| Rule Category | What It Detects | Action |
|---------------|----------------|--------|
| Credential exposure | API keys, JWTs, passwords in output | Block response, log violation |
| Destructive operations | DROP TABLE, DELETE FROM, TRUNCATE | Block response, log violation |
| PII/PHI exposure | SSN, date of birth, health records | Block response, log violation |
| Custom hard stops | Per-playbook rules defined by creator | Block response, log violation |

### Tier 2: Soft Warnings

Soft warnings flag potential issues but allow execution to continue with user awareness:

| Rule Category | What It Detects | Action |
|---------------|----------------|--------|
| Cost thresholds | Output referencing amounts > $100 | Flag in UI, log warning |
| Complexity alerts | Processes with > 15 steps | Suggest splitting |
| Security flags | References to vulnerabilities | Flag for review |
| Custom warnings | Per-playbook warning rules | Flag in UI, log warning |

### Tier 3: Compliance

Compliance rules are always enforced but don't halt execution:

| Rule | Enforcement |
|------|-------------|
| YAML output must be parseable | Validated before save |
| All harnesses must have >= 1 guardrail | Validated at creation |
| Step IDs must be snake_case and unique | Zod schema validation |

### Future: AI-Powered Classification

The current guardrail engine uses deterministic pattern matching. A planned enhancement uses Claude Haiku for semantic classification:

```
Step output → Haiku classifier → "Does this violate: [rule text]?" → yes/no
```

This catches violations that pattern matching misses (e.g., "Here's the password: hunter2" without a detectable pattern).

---

## Audit Logging

Every execution action is logged in the `execution_logs` table.

### What Gets Logged

| Event | Log Type | Content |
|-------|----------|---------|
| Step starts | `input` | Step ID, input prompt, model selected |
| Step completes | `output` | Step ID, output text, token usage, duration |
| Guardrail check | `guardrail` | Step ID, check result (blocked/warnings/violations) |
| Step fails | `error` | Step ID, error message, stack trace |
| Decision point | `decision` | Step ID, what the AI decided, alternatives considered |

### Log Properties

- **Immutable:** `execution_logs` has no UPDATE or DELETE policies. Logs cannot be modified once written.
- **Tenant-scoped:** Each log entry has a `tenant_id`. RLS prevents cross-tenant access.
- **Timestamped:** `created_at` is set by the database, not the application.
- **Structured:** Content is stored as JSONB for queryable audit trails.

### Retention

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Execution logs | 90 days (default) | Balance storage cost with audit needs |
| Run records | Indefinite | Business value in run history |
| Playbook versions | Indefinite | Version history for compliance |
| Archived playbooks | 1 year after archive | Soft delete with cleanup |

Retention periods are configurable per tenant (enterprise feature).

---

## Data Protection

### Encryption

| State | Method | Scope |
|-------|--------|-------|
| In transit | TLS 1.3 | All connections (Vercel, Supabase, Railway) |
| At rest (database) | AES-256 | Supabase managed encryption |
| At rest (backups) | AES-256 | Supabase encrypted backups |
| API keys | AES-256 (application) | If/when stored in DB |

### Data Flow Security

```
User → HTTPS → Vercel Edge → Supabase (RLS) → Response
                    │
                    ▼
               Claude API (TLS)
                    │
                    ▼
              GuardrailEngine (scan)
                    │
                    ▼
              Supabase (RLS write)
```

No data leaves the secure boundary without guardrail scanning. No unencrypted data crosses the network.

---

## Authentication & Authorization

### Authentication (Supabase Auth)

| Method | Status | Notes |
|--------|--------|-------|
| Email + password | Enabled | Primary auth method |
| Google OAuth | Enabled | Convenience login |
| GitHub OAuth | Planned | Developer persona |
| Magic link (email) | Planned | Passwordless option |

### Authorization (Role-Based)

| Role | Playbooks | Runs | Schedules | MCP Configs | Tenant Settings |
|------|-----------|------|-----------|-------------|-----------------|
| `admin` | Full CRUD | Full access | Full CRUD | Full CRUD | Full access |
| `member` | Create, read, edit own | Start runs, view all | Create, edit own | Read only | Read only |
| `viewer` | Read only | View only | Read only | No access | No access |

### Session Security

- JWT expiry: 1 hour (Supabase default)
- Refresh token rotation enabled
- Sessions invalidated on password change
- Max 5 concurrent sessions per user

---

## Input Validation

All external input is validated before processing:

| Input | Validation | Tool |
|-------|-----------|------|
| Playbook YAML | `HarnessConfigSchema.parse()` | Zod |
| API request bodies | Route-specific Zod schemas | Zod |
| Webhook payloads | Secret verification + body schema | Crypto + Zod |
| User chat messages | Length limit (10,000 chars), sanitized | Custom |
| URL parameters | UUID format validation | Zod (`z.string().uuid()`) |

### Preventing Injection

- **SQL injection:** Supabase client uses parameterized queries exclusively
- **XSS:** React automatically escapes output. `dangerouslySetInnerHTML` is never used
- **YAML injection:** `js-yaml` safe load mode (no code execution)
- **Prompt injection:** Guardrail system prompt is injected before user content. Hard stops detect attempts to override instructions

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| P0 (Critical) | Data breach, API key exposure | Immediate | API key found in logs |
| P1 (High) | Service outage, auth bypass | < 1 hour | RLS policy misconfigured |
| P2 (Medium) | Feature degraded, guardrail failure | < 4 hours | Guardrail not catching violations |
| P3 (Low) | UI bug, non-critical error | < 24 hours | Styling issue on timeline |

### Response Procedure

1. **Detect:** Sentry alert, UptimeRobot ping, user report
2. **Assess:** Determine severity level and blast radius
3. **Contain:** Disable affected feature (feature flag), rotate compromised credentials
4. **Fix:** Deploy patch, verify fix in staging, deploy to production
5. **Review:** Post-incident review, update guardrails/monitoring as needed
