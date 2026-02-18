// ── @yndr/db — Database table types ──

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: "admin" | "member" | "viewer";
  avatar_url: string | null;
  created_at: string;
}

export interface Playbook {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  yaml_source: string;
  step_count: number;
  guardrail_count: number;
  status: "draft" | "active" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PlaybookVersion {
  id: string;
  playbook_id: string;
  version_number: number;
  config: Record<string, unknown>;
  yaml_source: string;
  change_notes: string;
  created_by: string;
  created_at: string;
}

export interface Run {
  id: string;
  tenant_id: string;
  playbook_id: string;
  status: "pending" | "running" | "completed" | "failed" | "halted";
  started_by: string;
  inputs: Record<string, unknown>;
  state: Record<string, unknown>;
  step_results: Record<string, unknown>;
  guardrail_summary: Record<string, unknown>;
  total_tokens_input: number;
  total_tokens_output: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RunStep {
  id: string;
  run_id: string;
  step_id: string;
  step_name: string;
  step_type: string;
  status: "pending" | "running" | "completed" | "failed" | "blocked" | "skipped";
  output: string | null;
  model_used: string | null;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number;
  guardrail_check: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface Schedule {
  id: string;
  tenant_id: string;
  playbook_id: string;
  trigger_type: "cron" | "webhook" | "event_chain";
  cron_expression: string | null;
  webhook_secret: string | null;
  chain_from_playbook_id: string | null;
  inputs: Record<string, unknown>;
  enabled: boolean;
  last_triggered_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface McpConfig {
  id: string;
  tenant_id: string;
  name: string;
  server_url: string;
  transport: "stdio" | "sse";
  command: string | null;
  args: string[] | null;
  env_vars: Record<string, string> | null;
  enabled: boolean;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  tenant_id: string;
  run_id: string;
  step_id: string;
  log_type: "input" | "output" | "guardrail" | "error" | "decision";
  content: Record<string, unknown>;
  created_at: string;
}

// ── Supabase Database type map ──

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Tenant, "id" | "created_at">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: [];
      };
      playbooks: {
        Row: Playbook;
        Insert: Omit<Playbook, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Playbook, "id" | "created_at">>;
        Relationships: [];
      };
      playbook_versions: {
        Row: PlaybookVersion;
        Insert: Omit<PlaybookVersion, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PlaybookVersion, "id" | "created_at">>;
        Relationships: [];
      };
      runs: {
        Row: Run;
        Insert: Omit<Run, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Run, "id" | "created_at">>;
        Relationships: [];
      };
      run_steps: {
        Row: RunStep;
        Insert: Omit<RunStep, "id"> & { id?: string };
        Update: Partial<Omit<RunStep, "id">>;
        Relationships: [];
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Schedule, "id" | "created_at">>;
        Relationships: [];
      };
      mcp_configs: {
        Row: McpConfig;
        Insert: Omit<McpConfig, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<McpConfig, "id" | "created_at">>;
        Relationships: [];
      };
      execution_logs: {
        Row: ExecutionLog;
        Insert: Omit<ExecutionLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<ExecutionLog, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
