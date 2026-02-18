// ── @yndr/db — Database layer for YNDR Harness ──

import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import type { Database } from "./schema/tables.js";

// ── Client factory ──

export function createClient(url: string, key: string) {
  return supabaseCreateClient<Database>(url, key);
}

// ── Types ──

export type {
  Database,
  Tenant,
  Profile,
  Playbook,
  PlaybookVersion,
  Run,
  RunStep,
  Schedule,
  McpConfig,
  ExecutionLog,
} from "./schema/tables.js";

// ── Queries ──

export {
  getPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybook,
  deletePlaybook,
  getPlaybookVersions,
} from "./queries/playbooks.js";

export {
  getRuns,
  getRun,
  createRun,
  updateRun,
  getRunSteps,
  upsertRunStep,
  getRunLogs,
} from "./queries/runs.js";

export type { RunFilters } from "./queries/runs.js";
