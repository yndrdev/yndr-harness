import type { SupabaseClient } from "@supabase/supabase-js";
import type { Playbook, PlaybookVersion } from "../schema/tables.js";

// Use untyped client — proper types come from `supabase gen types` in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<any>;

export async function getPlaybooks(client: Client, tenantId: string): Promise<Playbook[]> {
  const { data, error } = await client
    .from("playbooks")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Playbook[];
}

export async function getPlaybook(client: Client, id: string): Promise<Playbook> {
  const { data, error } = await client
    .from("playbooks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Playbook;
}

export async function createPlaybook(
  client: Client,
  input: Omit<Playbook, "id" | "created_at" | "updated_at">,
): Promise<Playbook> {
  const { data, error } = await client
    .from("playbooks")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as Playbook;
}

export async function updatePlaybook(
  client: Client,
  id: string,
  input: Partial<Omit<Playbook, "id" | "created_at">>,
): Promise<Playbook> {
  const { data, error } = await client
    .from("playbooks")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Playbook;
}

export async function deletePlaybook(client: Client, id: string): Promise<void> {
  const { error } = await client
    .from("playbooks")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getPlaybookVersions(client: Client, playbookId: string): Promise<PlaybookVersion[]> {
  const { data, error } = await client
    .from("playbook_versions")
    .select("*")
    .eq("playbook_id", playbookId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data as PlaybookVersion[];
}
