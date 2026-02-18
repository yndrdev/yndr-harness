-- ══════════════════════════════════════════════════════════════
-- YNDR Harness — Supabase Database Migration
-- ══════════════════════════════════════════════════════════════

-- ── Helper: auto-update updated_at trigger ──

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ══════════════════════════════════════════════════════════════
-- TABLES
-- ══════════════════════════════════════════════════════════════

-- ── Tenants ──

create table public.tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();


-- ── Profiles ──

create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);


-- ── Playbooks ──

create table public.playbooks (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  name            text not null,
  description     text not null default '',
  config          jsonb not null default '{}',
  yaml_source     text not null default '',
  step_count      integer not null default 0,
  guardrail_count integer not null default 0,
  status          text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger playbooks_updated_at
  before update on public.playbooks
  for each row execute function public.set_updated_at();


-- ── Playbook Versions ──

create table public.playbook_versions (
  id              uuid primary key default gen_random_uuid(),
  playbook_id     uuid not null references public.playbooks(id) on delete cascade,
  version_number  integer not null,
  config          jsonb not null default '{}',
  yaml_source     text not null default '',
  change_notes    text not null default '',
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  unique (playbook_id, version_number)
);


-- ── Runs ──

create table public.runs (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  playbook_id         uuid not null references public.playbooks(id) on delete cascade,
  status              text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'halted')),
  started_by          uuid not null references public.profiles(id),
  inputs              jsonb not null default '{}',
  state               jsonb not null default '{}',
  step_results        jsonb not null default '{}',
  guardrail_summary   jsonb not null default '{}',
  total_tokens_input  integer not null default 0,
  total_tokens_output integer not null default 0,
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);


-- ── Run Steps ──

create table public.run_steps (
  id              uuid primary key default gen_random_uuid(),
  run_id          uuid not null references public.runs(id) on delete cascade,
  step_id         text not null,
  step_name       text not null,
  step_type       text not null,
  status          text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'blocked', 'skipped')),
  output          text,
  model_used      text,
  tokens_input    integer not null default 0,
  tokens_output   integer not null default 0,
  duration_ms     integer not null default 0,
  guardrail_check jsonb,
  started_at      timestamptz,
  completed_at    timestamptz
);


-- ── Schedules ──

create table public.schedules (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.tenants(id) on delete cascade,
  playbook_id             uuid not null references public.playbooks(id) on delete cascade,
  trigger_type            text not null check (trigger_type in ('cron', 'webhook', 'event_chain')),
  cron_expression         text,
  webhook_secret          text,
  chain_from_playbook_id  uuid references public.playbooks(id),
  inputs                  jsonb not null default '{}',
  enabled                 boolean not null default true,
  last_triggered_at       timestamptz,
  created_by              uuid not null references public.profiles(id),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger schedules_updated_at
  before update on public.schedules
  for each row execute function public.set_updated_at();


-- ── MCP Configs ──

create table public.mcp_configs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  name        text not null,
  server_url  text not null,
  transport   text not null check (transport in ('stdio', 'sse')),
  command     text,
  args        text[],
  env_vars    jsonb,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now()
);


-- ── Execution Logs ──

create table public.execution_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  run_id      uuid not null references public.runs(id) on delete cascade,
  step_id     text not null,
  log_type    text not null check (log_type in ('input', 'output', 'guardrail', 'error', 'decision')),
  content     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);


-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

-- Profiles
create index idx_profiles_tenant_id on public.profiles(tenant_id);

-- Playbooks
create index idx_playbooks_tenant_id on public.playbooks(tenant_id);
create index idx_playbooks_status on public.playbooks(status);
create index idx_playbooks_created_by on public.playbooks(created_by);
create index idx_playbooks_created_at on public.playbooks(created_at desc);

-- Playbook Versions
create index idx_playbook_versions_playbook_id on public.playbook_versions(playbook_id);

-- Runs
create index idx_runs_tenant_id on public.runs(tenant_id);
create index idx_runs_playbook_id on public.runs(playbook_id);
create index idx_runs_status on public.runs(status);
create index idx_runs_created_at on public.runs(created_at desc);
create index idx_runs_started_by on public.runs(started_by);

-- Run Steps
create index idx_run_steps_run_id on public.run_steps(run_id);
create index idx_run_steps_status on public.run_steps(status);

-- Schedules
create index idx_schedules_tenant_id on public.schedules(tenant_id);
create index idx_schedules_playbook_id on public.schedules(playbook_id);

-- MCP Configs
create index idx_mcp_configs_tenant_id on public.mcp_configs(tenant_id);

-- Execution Logs
create index idx_execution_logs_tenant_id on public.execution_logs(tenant_id);
create index idx_execution_logs_run_id on public.execution_logs(run_id);
create index idx_execution_logs_created_at on public.execution_logs(created_at desc);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

-- Helper: get the current user's tenant_id via their profile
create or replace function public.get_user_tenant_id()
returns uuid
language sql
stable
security definer
as $$
  select tenant_id from public.profiles where id = auth.uid() limit 1;
$$;

-- ── Enable RLS on all tables ──

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.playbooks enable row level security;
alter table public.playbook_versions enable row level security;
alter table public.runs enable row level security;
alter table public.run_steps enable row level security;
alter table public.schedules enable row level security;
alter table public.mcp_configs enable row level security;
alter table public.execution_logs enable row level security;

-- ── Tenants ──

create policy "Users can view their own tenant"
  on public.tenants for select
  using (id = public.get_user_tenant_id());

create policy "Admins can update their tenant"
  on public.tenants for update
  using (id = public.get_user_tenant_id())
  with check (id = public.get_user_tenant_id());

-- ── Profiles ──

create policy "Users can view profiles in their tenant"
  on public.profiles for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── Playbooks ──

create policy "Users can view playbooks in their tenant"
  on public.playbooks for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can create playbooks in their tenant"
  on public.playbooks for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update playbooks in their tenant"
  on public.playbooks for update
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can delete playbooks in their tenant"
  on public.playbooks for delete
  using (tenant_id = public.get_user_tenant_id());

-- ── Playbook Versions ──

create policy "Users can view playbook versions in their tenant"
  on public.playbook_versions for select
  using (
    playbook_id in (
      select id from public.playbooks where tenant_id = public.get_user_tenant_id()
    )
  );

create policy "Users can create playbook versions in their tenant"
  on public.playbook_versions for insert
  with check (
    playbook_id in (
      select id from public.playbooks where tenant_id = public.get_user_tenant_id()
    )
  );

-- ── Runs ──

create policy "Users can view runs in their tenant"
  on public.runs for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can create runs in their tenant"
  on public.runs for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update runs in their tenant"
  on public.runs for update
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

-- ── Run Steps ──

create policy "Users can view run steps in their tenant"
  on public.run_steps for select
  using (
    run_id in (
      select id from public.runs where tenant_id = public.get_user_tenant_id()
    )
  );

create policy "Users can create run steps in their tenant"
  on public.run_steps for insert
  with check (
    run_id in (
      select id from public.runs where tenant_id = public.get_user_tenant_id()
    )
  );

create policy "Users can update run steps in their tenant"
  on public.run_steps for update
  using (
    run_id in (
      select id from public.runs where tenant_id = public.get_user_tenant_id()
    )
  );

-- ── Schedules ──

create policy "Users can view schedules in their tenant"
  on public.schedules for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can create schedules in their tenant"
  on public.schedules for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update schedules in their tenant"
  on public.schedules for update
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can delete schedules in their tenant"
  on public.schedules for delete
  using (tenant_id = public.get_user_tenant_id());

-- ── MCP Configs ──

create policy "Users can view mcp configs in their tenant"
  on public.mcp_configs for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can create mcp configs in their tenant"
  on public.mcp_configs for insert
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can update mcp configs in their tenant"
  on public.mcp_configs for update
  using (tenant_id = public.get_user_tenant_id())
  with check (tenant_id = public.get_user_tenant_id());

create policy "Users can delete mcp configs in their tenant"
  on public.mcp_configs for delete
  using (tenant_id = public.get_user_tenant_id());

-- ── Execution Logs ──

create policy "Users can view execution logs in their tenant"
  on public.execution_logs for select
  using (tenant_id = public.get_user_tenant_id());

create policy "Users can create execution logs in their tenant"
  on public.execution_logs for insert
  with check (tenant_id = public.get_user_tenant_id());
