import Link from "next/link";
import { PlaybookCard } from "@/components/playbook-card";
import { createServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function PlaybooksPage() {
  let playbooks: Array<{
    id: string;
    name: string;
    description: string;
    step_count: number;
    guardrail_count: number;
    status: string;
    created_at: string;
  }> = [];

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from("playbooks")
      .select("id, name, description, step_count, guardrail_count, status, created_at")
      .order("created_at", { ascending: false });

    if (data) playbooks = data;
  } catch {
    // Supabase not configured — show empty state
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Your Playbooks
          </h1>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Manage and run your AI-powered playbooks.
          </p>
        </div>
        <Link
          href="/build"
          className="inline-flex h-10 items-center rounded-lg bg-[var(--yndr-red)] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d13a52]"
        >
          New Playbook
        </Link>
      </div>

      {playbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-16">
          <p className="mb-2 text-lg font-medium text-[var(--foreground)]">
            No playbooks yet
          </p>
          <p className="mb-6 text-sm text-[var(--muted-foreground)]">
            Build your first playbook by describing a process to automate.
          </p>
          <Link
            href="/build"
            className="inline-flex h-10 items-center rounded-lg bg-[var(--yndr-red)] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d13a52]"
          >
            Build a Playbook
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              name={playbook.name}
              description={playbook.description}
              stepCount={playbook.step_count}
              guardrailCount={playbook.guardrail_count}
              href={`/playbooks/${playbook.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
