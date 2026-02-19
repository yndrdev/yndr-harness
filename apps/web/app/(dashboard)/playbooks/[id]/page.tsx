import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServerClient();
  const { data: playbook, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !playbook) {
    notFound();
  }

  // Parse steps from config
  const steps = (playbook.config as Record<string, unknown>)?.steps as
    | Array<{ id: string; name?: string; type?: string; prompt?: string }>
    | undefined;

  const guardrails = (playbook.config as Record<string, unknown>)?.guardrails as
    | { hard_stops?: string[]; soft_warnings?: string[]; compliance?: string[] }
    | undefined;

  return (
    <div>
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <Link
            href="/playbooks"
            className="hover:text-[var(--foreground)]"
          >
            Playbooks
          </Link>
          <span>/</span>
          <span>{playbook.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {playbook.name}
        </h1>
        {playbook.description && (
          <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
            {playbook.description}
          </p>
        )}
      </div>

      <div className="mb-8 flex gap-3">
        <Link
          href={`/playbooks/${id}/run`}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--yndr-red)] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d13a52]"
        >
          Run this Playbook
        </Link>
        <span className="inline-flex h-10 items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--muted-foreground)]">
          {playbook.status}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">Steps</div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {playbook.step_count}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">Guardrails</div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {playbook.guardrail_count}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">Created</div>
            <div className="text-sm font-medium text-[var(--foreground)]">
              {new Date(playbook.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Guardrails */}
      {guardrails && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Guardrails
          </h2>
          <div className="space-y-2">
            {guardrails.hard_stops?.map((rule, i) => (
              <div
                key={`hard-${i}`}
                className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm"
              >
                <span className="mt-0.5 text-red-400">&#x26D4;</span>
                <span className="text-[var(--foreground)]">{rule}</span>
              </div>
            ))}
            {guardrails.soft_warnings?.map((rule, i) => (
              <div
                key={`warn-${i}`}
                className="flex items-start gap-2 rounded-md border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-sm"
              >
                <span className="mt-0.5 text-yellow-400">&#x26A0;</span>
                <span className="text-[var(--foreground)]">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps list */}
      {steps && steps.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Steps
          </h2>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--yndr-red)]/10 text-xs font-bold text-[var(--yndr-red)]">
                  {i + 1}
                </div>
                <div>
                  <div className="font-medium text-[var(--foreground)]">
                    {step.name ?? step.id}
                  </div>
                  {step.type && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {step.type}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YAML source */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          YAML Config
        </h2>
        <pre className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-xs leading-relaxed text-emerald-400">
          <code>{playbook.yaml_source}</code>
        </pre>
      </div>
    </div>
  );
}
