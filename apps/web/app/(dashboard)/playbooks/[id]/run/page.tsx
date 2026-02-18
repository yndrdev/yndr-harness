import { RunTimeline } from "@/components/run-timeline";

const demoSteps = [
  {
    id: "1",
    name: "Gather input data",
    status: "complete" as const,
    output: "Collected 12 input parameters from user configuration.",
  },
  {
    id: "2",
    name: "Validate inputs",
    status: "complete" as const,
    output: "All inputs passed validation. 3 guardrails checked.",
  },
  {
    id: "3",
    name: "Process with AI",
    status: "running" as const,
    output: "Processing batch 2 of 3...",
  },
  {
    id: "4",
    name: "Review output",
    status: "pending" as const,
    output: null,
  },
  {
    id: "5",
    name: "Deliver results",
    status: "pending" as const,
    output: null,
  },
];

export default async function RunPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-8">
        <div className="mb-1 text-sm text-[var(--muted-foreground)]">
          Running Playbook #{id}
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Run Mode
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Executing playbook steps in sequence.
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-[var(--yndr-red)]/10 px-3 py-1 text-sm text-[var(--yndr-red)]">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--yndr-red)]" />
          Running
        </div>
        <span className="text-sm text-[var(--muted-foreground)]">
          Step 3 of 5
        </span>
      </div>

      <RunTimeline steps={demoSteps} />
    </div>
  );
}
