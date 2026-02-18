# Database Schema — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18
**Engine:** PostgreSQL 15 (Supabase)

---

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐
│   tenants    │──1:N──│    profiles       │
│              │       │  (users per org)  │
└──────┬───────┘       └──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐       ┌──────────────────────┐
│    playbooks     │──1:N──│  playbook_versions    │
│                  │       │  (immutable history)  │
└──────┬───────────┘       └──────────────────────┘
       │
       ├── 1:N
       │
       ▼
┌──────────────────┐       ┌──────────────────┐
│      runs        │──1:N──│    run_steps      │
│                  │       │  (per-step result) │
└──────┬───────────┘       └──────────────────┘
       │
       │ 1:N
       ▼
┌──────────────────┐
│ execution_logs   │
│ (audit trail)    │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   schedules      │       │   mcp_configs     │
│ (cron/webhook/   │       │  (external tools) │
│  event chain)    │       │                   │
└──────────────────┘       └──────────────────┘
```

---

## Tables

### tenants

Multi-tenant root table. Every resource belongs to a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Tenant identifier |
| `name` | `text` | NOT NULL | Organization name |
| `slug` | `text` | NOT NULL, UNIQUE | URL-friendly slug |
| `settings` | `jsonb` | DEFAULT '{}' | Tenant-level configuration |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last modified timestamp |

### profiles

User profiles linked to Supabase Auth users and assigned to a tenant.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, REFERENCES auth.users(id) | Supabase Auth user ID |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `email` | `text` | NOT NULL | User email |
| `full_name` | `text` | NOT NULL | Display name |
| `role` | `text` | NOT NULL, CHECK IN ('admin','member','viewer') | Tenant role |
| `avatar_url` | `text` | NULLABLE | Profile image URL |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |

### playbooks

Harness/playbook configurations. Config stored as JSONB for querying, YAML source preserved for editing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Playbook identifier |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `name` | `text` | NOT NULL | Playbook display name |
| `description` | `text` | DEFAULT '' | Human-readable description |
| `config` | `jsonb` | NOT NULL | Parsed harness config (Zod-validated) |
| `yaml_source` | `text` | NOT NULL | Original YAML source |
| `step_count` | `integer` | DEFAULT 0 | Cached count of steps |
| `guardrail_count` | `integer` | DEFAULT 0 | Cached count of guardrail rules |
| `status` | `text` | NOT NULL, CHECK IN ('draft','active','archived') | Lifecycle status |
| `created_by` | `uuid` | NOT NULL, FK → profiles(id) | Creator |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last modified timestamp |

### playbook_versions

Immutable version history. Every edit creates a new version.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Version identifier |
| `playbook_id` | `uuid` | NOT NULL, FK → playbooks(id) ON DELETE CASCADE | Parent playbook |
| `version_number` | `integer` | NOT NULL | Sequential version number |
| `config` | `jsonb` | NOT NULL | Config snapshot at this version |
| `yaml_source` | `text` | NOT NULL | YAML snapshot at this version |
| `change_notes` | `text` | DEFAULT '' | Description of changes |
| `created_by` | `uuid` | NOT NULL, FK → profiles(id) | Who made the change |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |

**Unique constraint:** `(playbook_id, version_number)`

### runs

Execution records. One run = one execution of a playbook.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Run identifier |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `playbook_id` | `uuid` | NOT NULL, FK → playbooks(id) | Which playbook was run |
| `status` | `text` | NOT NULL, CHECK IN ('pending','running','completed','failed','halted') | Execution status |
| `started_by` | `uuid` | NOT NULL, FK → profiles(id) | Who initiated |
| `inputs` | `jsonb` | DEFAULT '{}' | User-provided inputs at run start |
| `state` | `jsonb` | DEFAULT '{}' | Current execution state |
| `step_results` | `jsonb` | DEFAULT '{}' | Aggregated step outputs |
| `guardrail_summary` | `jsonb` | DEFAULT '{}' | Violation/warning counts |
| `total_tokens_input` | `integer` | DEFAULT 0 | Total input tokens consumed |
| `total_tokens_output` | `integer` | DEFAULT 0 | Total output tokens consumed |
| `started_at` | `timestamptz` | NULLABLE | When execution began |
| `completed_at` | `timestamptz` | NULLABLE | When execution finished |
| `created_at` | `timestamptz` | DEFAULT now() | Record creation time |

### run_steps

Per-step execution results within a run. Used for live timeline updates via Supabase Realtime.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Step result identifier |
| `run_id` | `uuid` | NOT NULL, FK → runs(id) ON DELETE CASCADE | Parent run |
| `step_id` | `text` | NOT NULL | Step ID from playbook config |
| `step_name` | `text` | NOT NULL | Human-readable step name |
| `step_type` | `text` | NOT NULL | interactive / autonomous / validation |
| `status` | `text` | NOT NULL, CHECK IN ('pending','running','completed','failed','blocked','skipped') | Step status |
| `output` | `text` | NULLABLE | Step output text |
| `model_used` | `text` | NULLABLE | Claude model ID used |
| `tokens_input` | `integer` | DEFAULT 0 | Input tokens for this step |
| `tokens_output` | `integer` | DEFAULT 0 | Output tokens for this step |
| `duration_ms` | `integer` | DEFAULT 0 | Execution time in milliseconds |
| `guardrail_check` | `jsonb` | NULLABLE | Guardrail check result |
| `started_at` | `timestamptz` | NULLABLE | Step execution start |
| `completed_at` | `timestamptz` | NULLABLE | Step execution end |

### schedules

Automated triggers for playbook runs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Schedule identifier |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `playbook_id` | `uuid` | NOT NULL, FK → playbooks(id) | Playbook to execute |
| `trigger_type` | `text` | NOT NULL, CHECK IN ('cron','webhook','event_chain') | How the run is triggered |
| `cron_expression` | `text` | NULLABLE | Cron schedule (e.g., '0 9 * * 1') |
| `webhook_secret` | `text` | NULLABLE | Secret for webhook auth |
| `chain_from_playbook_id` | `uuid` | NULLABLE, FK → playbooks(id) | Trigger when this playbook completes |
| `inputs` | `jsonb` | DEFAULT '{}' | Default inputs for scheduled runs |
| `enabled` | `boolean` | DEFAULT true | Whether schedule is active |
| `last_triggered_at` | `timestamptz` | NULLABLE | Last execution time |
| `created_by` | `uuid` | NOT NULL, FK → profiles(id) | Creator |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |
| `updated_at` | `timestamptz` | DEFAULT now() | Last modified timestamp |

### mcp_configs

External tool connections via Model Context Protocol.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Config identifier |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `name` | `text` | NOT NULL | Display name (e.g., "Slack", "Gmail") |
| `server_url` | `text` | NOT NULL | MCP server endpoint |
| `transport` | `text` | NOT NULL, CHECK IN ('stdio','sse') | Connection transport |
| `command` | `text` | NULLABLE | Command for stdio transport |
| `args` | `text[]` | NULLABLE | Arguments for stdio command |
| `env_vars` | `jsonb` | NULLABLE | Environment variables (encrypted) |
| `enabled` | `boolean` | DEFAULT true | Whether connection is active |
| `created_at` | `timestamptz` | DEFAULT now() | Created timestamp |

### execution_logs

Immutable audit trail of all execution activity.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Log entry identifier |
| `tenant_id` | `uuid` | NOT NULL, FK → tenants(id) | Owning tenant |
| `run_id` | `uuid` | NOT NULL, FK → runs(id) ON DELETE CASCADE | Parent run |
| `step_id` | `text` | NOT NULL | Which step generated this log |
| `log_type` | `text` | NOT NULL, CHECK IN ('input','output','guardrail','error','decision') | Log category |
| `content` | `jsonb` | NOT NULL | Structured log content |
| `created_at` | `timestamptz` | DEFAULT now() | Log timestamp |

---

## Row Level Security (RLS) Policies

All tables have RLS enabled. Policies ensure tenant isolation.

### Pattern

Every policy follows the same pattern: users can only access rows where `tenant_id` matches their own tenant.

```sql
-- Helper function: get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Example policy (applied to every table with tenant_id)
CREATE POLICY "Tenant isolation"
  ON playbooks
  FOR ALL
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());
```

### Per-Table Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tenants | Own tenant only | Admin only | Admin only | Never (soft delete) |
| profiles | Same tenant | Admin only | Own profile or admin | Admin only |
| playbooks | Same tenant | Member+ | Creator or admin | Creator or admin |
| playbook_versions | Same tenant | System (on playbook save) | Never (immutable) | Never (immutable) |
| runs | Same tenant | Member+ | System only | Never (audit) |
| run_steps | Same tenant | System only | System only | Never (audit) |
| schedules | Same tenant | Member+ | Creator or admin | Creator or admin |
| mcp_configs | Same tenant, admin only | Admin only | Admin only | Admin only |
| execution_logs | Same tenant | System only | Never (immutable) | Never (immutable) |

---

## Indexes

```sql
-- Playbooks
CREATE INDEX idx_playbooks_tenant ON playbooks(tenant_id);
CREATE INDEX idx_playbooks_status ON playbooks(tenant_id, status);
CREATE INDEX idx_playbooks_created ON playbooks(tenant_id, created_at DESC);

-- Runs
CREATE INDEX idx_runs_tenant ON runs(tenant_id);
CREATE INDEX idx_runs_playbook ON runs(playbook_id);
CREATE INDEX idx_runs_status ON runs(tenant_id, status);
CREATE INDEX idx_runs_created ON runs(tenant_id, created_at DESC);

-- Run Steps (high-traffic for Realtime subscriptions)
CREATE INDEX idx_run_steps_run ON run_steps(run_id);
CREATE INDEX idx_run_steps_status ON run_steps(run_id, status);

-- Execution Logs (append-only, queried by run)
CREATE INDEX idx_execution_logs_run ON execution_logs(run_id);
CREATE INDEX idx_execution_logs_step ON execution_logs(run_id, step_id);
CREATE INDEX idx_execution_logs_type ON execution_logs(run_id, log_type);

-- Schedules
CREATE INDEX idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX idx_schedules_playbook ON schedules(playbook_id);
CREATE INDEX idx_schedules_enabled ON schedules(tenant_id, enabled) WHERE enabled = true;

-- Playbook Versions
CREATE INDEX idx_versions_playbook ON playbook_versions(playbook_id, version_number DESC);
```

---

## Migration Approach

### Strategy
- Use Supabase CLI for local development (`supabase db diff`, `supabase migration new`)
- Migrations stored in `packages/db/supabase/migrations/`
- Applied automatically on `supabase db push` (staging) and via CI for production

### Migration Order
1. `001_create_tenants.sql` — tenants table + RLS
2. `002_create_profiles.sql` — profiles table + trigger to create profile on auth signup
3. `003_create_playbooks.sql` — playbooks + playbook_versions + triggers
4. `004_create_runs.sql` — runs + run_steps + execution_logs
5. `005_create_schedules.sql` — schedules table
6. `006_create_mcp_configs.sql` — MCP configurations
7. `007_create_indexes.sql` — All indexes
8. `008_create_rls_policies.sql` — All RLS policies
9. `009_create_functions.sql` — Helper functions (get_user_tenant_id, etc.)

### Auto-update Trigger

```sql
-- Applied to all tables with updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```
