import type { SupabaseClient } from "@supabase/supabase-js";
import type { Run, RunStep, ExecutionLog } from "../schema/tables.js";

// Use untyped client — proper types come from `supabase gen types` in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export interface RunFilters {
  playbook_id?: string;
  status?: Run["status"];
  started_by?: string;
  limit?: number;
  offset?: number;
}

export async function getRuns(client: Client, tenantId: string, filters?: RunFilters): Promise<Run[]> {
  let query = client
    .from("runs")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters?.playbook_id) {
    query = query.eq("playbook_id", filters.playbook_id);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.started_by) {
    query = query.eq("started_by", filters.started_by);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Run[];
}

export async function getRun(client: Client, id: string): Promise<Run> {
  const { data, error } = await client
    .from("runs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Run;
}

export async function createRun(
  client: Client,
  input: Omit<Run, "id" | "created_at">,
): Promise<Run> {
  const { data, error } = await client
    .from("runs")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Run;
}

export async function updateRun(
  client: Client,
  id: string,
  input: Partial<Omit<Run, "id" | "created_at">>,
): Promise<Run> {
  const { data, error } = await client
    .from("runs")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Run;
}

export async function getRunSteps(client: Client, runId: string): Promise<RunStep[]> {
  const { data, error } = await client
    .from("run_steps")
    .select("*")
    .eq("run_id", runId)
    .order("started_at", { ascending: true });

  if (error) throw error;
  return data as RunStep[];
}

export async function upsertRunStep(
  client: Client,
  input: Omit<RunStep, "id"> & { id?: string },
): Promise<RunStep> {
  const { data, error } = await client
    .from("run_steps")
    .upsert(input, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as RunStep;
}

export async function getRunLogs(client: Client, runId: string): Promise<ExecutionLog[]> {
  const { data, error } = await client
    .from("execution_logs")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as ExecutionLog[];
}
