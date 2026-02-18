# API Specification — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18
**Base URL:** `/api`
**Auth:** All endpoints require Supabase Auth JWT in `Authorization: Bearer <token>` header

---

## Authentication

All API requests must include a valid Supabase Auth session. The JWT is extracted server-side to identify the user and their tenant.

```typescript
// Server-side auth check pattern (Next.js Route Handler)
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${session.access_token}` } }
});
```

**Error responses for auth issues:**
- `401 Unauthorized` — Missing or invalid token
- `403 Forbidden` — Valid token but insufficient permissions

---

## Playbooks

### POST /api/playbooks — Create Playbook

Creates a new playbook from YAML source.

**Request:**
```json
{
  "name": "Client Onboarding",
  "description": "Automates new client setup",
  "yaml_source": "harness:\n  name: Client Onboarding\n  ..."
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Client Onboarding",
  "description": "Automates new client setup",
  "config": { "harness": { "name": "Client Onboarding", "version": "1.0", "description": "..." }, "..." },
  "yaml_source": "harness:\n  name: Client Onboarding\n  ...",
  "step_count": 5,
  "guardrail_count": 8,
  "status": "draft",
  "created_by": "uuid",
  "created_at": "2026-02-18T10:00:00Z",
  "updated_at": "2026-02-18T10:00:00Z"
}
```

**Errors:**
- `400` — Invalid YAML or Zod validation failure (returns validation errors)
- `401` — Unauthorized

**Server logic:**
1. Parse `yaml_source` with `js-yaml`
2. Validate parsed object against `HarnessConfigSchema` (Zod)
3. Count steps and guardrail rules
4. Insert into `playbooks` table
5. Create initial `playbook_versions` entry (version 1)

---

### GET /api/playbooks — List Playbooks

Returns all playbooks for the current tenant.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | Filter by status: `draft`, `active`, `archived` |
| `search` | string | - | Search by name (case-insensitive) |
| `limit` | number | 20 | Max results |
| `offset` | number | 0 | Pagination offset |

**Response (200 OK):**
```json
{
  "playbooks": [
    {
      "id": "uuid",
      "name": "Client Onboarding",
      "description": "Automates new client setup",
      "step_count": 5,
      "guardrail_count": 8,
      "status": "active",
      "created_at": "2026-02-18T10:00:00Z",
      "updated_at": "2026-02-18T10:00:00Z"
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/playbooks/[id] — Get Playbook

Returns a single playbook with full config.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "name": "Client Onboarding",
  "description": "Automates new client setup",
  "config": { "..." },
  "yaml_source": "harness:\n  ...",
  "step_count": 5,
  "guardrail_count": 8,
  "status": "active",
  "created_by": "uuid",
  "created_at": "2026-02-18T10:00:00Z",
  "updated_at": "2026-02-18T10:00:00Z",
  "versions": [
    { "version_number": 2, "change_notes": "Added email step", "created_at": "..." },
    { "version_number": 1, "change_notes": "Initial version", "created_at": "..." }
  ],
  "recent_runs": [
    { "id": "uuid", "status": "completed", "started_at": "...", "completed_at": "..." }
  ]
}
```

**Errors:**
- `404` — Playbook not found or belongs to different tenant

---

### PUT /api/playbooks/[id] — Update Playbook

Updates a playbook. Creates a new version entry.

**Request:**
```json
{
  "name": "Client Onboarding v2",
  "description": "Updated onboarding flow",
  "yaml_source": "harness:\n  name: Client Onboarding v2\n  ...",
  "change_notes": "Added email notification step"
}
```

**Response (200 OK):** Updated playbook object (same shape as GET).

**Server logic:**
1. Parse and validate new YAML
2. Update `playbooks` row
3. Insert new `playbook_versions` row with incremented version number

---

### DELETE /api/playbooks/[id] — Delete Playbook

Soft-deletes a playbook by setting status to `archived`.

**Response (200 OK):**
```json
{ "id": "uuid", "status": "archived" }
```

**Errors:**
- `404` — Not found
- `403` — Not the creator or admin

---

## Runs

### POST /api/playbooks/[id]/run — Start a Run

Initiates a new playbook execution.

**Request:**
```json
{
  "inputs": {
    "client_name": "Acme Corp",
    "project_type": "web_app"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "playbook_id": "uuid",
  "status": "pending",
  "started_by": "uuid",
  "inputs": { "client_name": "Acme Corp", "project_type": "web_app" },
  "created_at": "2026-02-18T10:00:00Z"
}
```

**Server logic:**
1. Load playbook config from database
2. Validate with Zod
3. Create `runs` row with status `pending`
4. Create `run_steps` rows for each step (all `pending`)
5. Start RunEngine execution (async — returns immediately)
6. Engine updates `run_steps` as it progresses (triggers Realtime)

**Long-running detection:**
- If `step_count > 10` or estimated duration > 300s, delegate to Railway
- Otherwise, execute inline in the serverless function

---

### GET /api/runs — List Runs

Returns runs for the current tenant.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `playbook_id` | uuid | - | Filter by playbook |
| `status` | string | all | Filter by status |
| `limit` | number | 20 | Max results |
| `offset` | number | 0 | Pagination offset |

**Response (200 OK):**
```json
{
  "runs": [
    {
      "id": "uuid",
      "playbook_id": "uuid",
      "playbook_name": "Client Onboarding",
      "status": "completed",
      "started_by": "uuid",
      "total_tokens_input": 4200,
      "total_tokens_output": 1800,
      "started_at": "2026-02-18T10:00:00Z",
      "completed_at": "2026-02-18T10:05:23Z",
      "created_at": "2026-02-18T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/runs/[id] — Get Run with Steps

Returns a run with all step results.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "playbook_id": "uuid",
  "playbook_name": "Client Onboarding",
  "status": "completed",
  "started_by": "uuid",
  "inputs": { "client_name": "Acme Corp" },
  "step_results": {
    "discovery": { "output": "...", "status": "completed" },
    "tech_assessment": { "output": "...", "status": "completed" }
  },
  "guardrail_summary": {
    "totalViolations": 0,
    "totalWarnings": 1,
    "violations": [],
    "warnings": [{ "rule": "Budget below $15K", "timestamp": "..." }]
  },
  "total_tokens_input": 4200,
  "total_tokens_output": 1800,
  "started_at": "2026-02-18T10:00:00Z",
  "completed_at": "2026-02-18T10:05:23Z",
  "steps": [
    {
      "id": "uuid",
      "step_id": "discovery",
      "step_name": "Client Discovery",
      "step_type": "interactive",
      "status": "completed",
      "output": "Client: Acme Corp. Project: Web application...",
      "model_used": "claude-sonnet-4-20250514",
      "tokens_input": 1200,
      "tokens_output": 450,
      "duration_ms": 3200,
      "guardrail_check": { "blocked": false, "warnings": [], "violations": [] },
      "started_at": "2026-02-18T10:00:00Z",
      "completed_at": "2026-02-18T10:00:03Z"
    }
  ]
}
```

---

## Build Mode

### POST /api/build/message — Send Build Mode Message

Sends a user message in the Build Mode conversation. Returns a streaming response from the AI Trail Guide.

**Request:**
```json
{
  "conversation_id": "uuid",
  "message": "I want to automate my client onboarding process"
}
```

If `conversation_id` is omitted, a new conversation is created.

**Response (200 OK, streaming SSE):**
```
data: {"type":"text","content":"Great! Let me learn more about your onboarding process. "}
data: {"type":"text","content":"What's the first thing you do when a new client signs up?"}
data: {"type":"done","conversation_id":"uuid","step":"deep_dive","question_index":0}
```

**Final message (when playbook is generated):**
```
data: {"type":"playbook","yaml":"harness:\n  name: Client Onboarding\n  ...","conversation_id":"uuid"}
data: {"type":"done","conversation_id":"uuid","step":"deliver"}
```

---

## Webhooks

### POST /api/webhooks/[id] — Webhook Trigger

External endpoint for triggering scheduled runs. Authenticated via webhook secret.

**Headers:**
```
X-Webhook-Secret: <schedule.webhook_secret>
```

**Request (optional inputs override):**
```json
{
  "inputs": {
    "source": "external_system",
    "data": { "..." }
  }
}
```

**Response (200 OK):**
```json
{
  "run_id": "uuid",
  "status": "pending",
  "message": "Run initiated successfully"
}
```

**Errors:**
- `401` — Invalid webhook secret
- `404` — Schedule not found or disabled
- `429` — Rate limited (max 60 requests/minute per schedule)

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid YAML: missing required field 'harness.name'",
    "details": [
      { "path": ["harness", "name"], "message": "Required" }
    ]
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `YAML_PARSE_ERROR` | 400 | Invalid YAML syntax |
| `SCHEMA_ERROR` | 400 | Valid YAML but fails Zod schema |
| `RUN_ERROR` | 500 | Engine execution error |
| `RATE_LIMITED` | 429 | Too many requests |
