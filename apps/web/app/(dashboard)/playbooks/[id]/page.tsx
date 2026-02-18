import Link from "next/link";
import { StepDiagram } from "@/components/step-diagram";

const demoSteps = [
  { id: "1", name: "Gather input data", description: "Collect required parameters and context" },
  { id: "2", name: "Validate inputs", description: "Run guardrail checks on provided data" },
  { id: "3", name: "Process with AI", description: "Send validated data to the AI engine" },
  { id: "4", name: "Review output", description: "Apply output guardrails and quality checks" },
  { id: "5", name: "Deliver results", description: "Format and deliver the final output" },
];

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <div className="mb-8">
        <div className="mb-1 text-sm text-[var(--muted-foreground)]">
          Playbook #{id}
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Customer Onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
          Automate the end-to-end customer onboarding flow including account
          setup, welcome emails, and initial configuration.
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <Link
          href={`/playbooks/${id}/run`}
          className="inline-flex h-10 items-center rounded-lg bg-[var(--yndr-red)] px-5 text-sm font-medium text-white transition-colors hover:bg-[#d13a52]"
        >
          Run this Playbook
        </Link>
        <button className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
          Edit
        </button>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
          Steps
        </h2>
        <StepDiagram steps={demoSteps} />
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
        <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">
          Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">Steps</div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              {demoSteps.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Guardrails
            </div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              3
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--muted-foreground)]">
              Last Run
            </div>
            <div className="text-xl font-semibold text-[var(--foreground)]">
              Never
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
