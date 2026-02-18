import Link from "next/link";
import { PlaybookCard } from "@/components/playbook-card";

const demoPlaybooks = [
  {
    id: "1",
    name: "Customer Onboarding",
    description:
      "Automate the end-to-end customer onboarding flow including account setup, welcome emails, and initial configuration.",
    stepCount: 8,
    guardrailCount: 3,
  },
  {
    id: "2",
    name: "Content Review Pipeline",
    description:
      "Review and approve content submissions with AI-powered quality checks, compliance validation, and editorial feedback.",
    stepCount: 5,
    guardrailCount: 4,
  },
  {
    id: "3",
    name: "Incident Response",
    description:
      "Structured incident response workflow with severity assessment, team notification, root cause analysis, and post-mortem.",
    stepCount: 12,
    guardrailCount: 6,
  },
];

export default function PlaybooksPage() {
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoPlaybooks.map((playbook) => (
          <PlaybookCard
            key={playbook.id}
            name={playbook.name}
            description={playbook.description}
            stepCount={playbook.stepCount}
            guardrailCount={playbook.guardrailCount}
            href={`/playbooks/${playbook.id}`}
          />
        ))}
      </div>
    </div>
  );
}
