import Link from "next/link";

const demoRuns = [
  {
    id: "run-1",
    playbook: "Customer Onboarding",
    status: "completed",
    started: "2 hours ago",
    duration: "3m 42s",
    stepsCompleted: "8/8",
  },
  {
    id: "run-2",
    playbook: "Content Review Pipeline",
    status: "running",
    started: "5 minutes ago",
    duration: "—",
    stepsCompleted: "2/5",
  },
  {
    id: "run-3",
    playbook: "Incident Response",
    status: "failed",
    started: "1 day ago",
    duration: "1m 15s",
    stepsCompleted: "4/12",
  },
  {
    id: "run-4",
    playbook: "Customer Onboarding",
    status: "completed",
    started: "3 days ago",
    duration: "4m 01s",
    stepsCompleted: "8/8",
  },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed:
      "bg-emerald-500/10 text-emerald-400",
    running:
      "bg-[var(--yndr-red)]/10 text-[var(--yndr-red)]",
    failed: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}
    >
      {status === "running" && (
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function RunsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Run History
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          View past and active playbook runs.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--card)]">
              <th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
                Playbook
              </th>
              <th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
                Status
              </th>
              <th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
                Started
              </th>
              <th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
                Duration
              </th>
              <th className="px-4 py-3 font-medium text-[var(--muted-foreground)]">
                Steps
              </th>
            </tr>
          </thead>
          <tbody>
            {demoRuns.map((run) => (
              <tr
                key={run.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/runs/${run.id}`}
                    className="font-medium text-[var(--foreground)] hover:text-[var(--yndr-red)]"
                  >
                    {run.playbook}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {run.started}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {run.duration}
                </td>
                <td className="px-4 py-3 text-[var(--muted-foreground)]">
                  {run.stepsCompleted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
