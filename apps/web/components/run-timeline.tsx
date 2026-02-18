import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface TimelineStep {
  id: string;
  name: string;
  status: "pending" | "running" | "complete";
  output: string | null;
}

function StatusIcon({ status }: { status: TimelineStep["status"] }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 size={20} className="text-emerald-400" />;
    case "running":
      return (
        <Loader2
          size={20}
          className="animate-spin text-[var(--yndr-red)]"
        />
      );
    case "pending":
      return <Circle size={20} className="text-[var(--muted-foreground)]" />;
  }
}

export function RunTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex gap-4">
          {/* Vertical line */}
          {i < steps.length - 1 && (
            <div className="absolute left-[9px] top-7 h-[calc(100%-4px)] w-px bg-[var(--border)]" />
          )}

          {/* Icon */}
          <div className="relative z-10 flex-shrink-0 pt-0.5">
            <StatusIcon status={step.status} />
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`text-sm font-medium ${
                  step.status === "complete"
                    ? "text-[var(--foreground)]"
                    : step.status === "running"
                      ? "text-[var(--yndr-red)]"
                      : "text-[var(--muted-foreground)]"
                }`}
              >
                {step.name}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                Step {i + 1}
              </span>
            </div>
            {step.output && (
              <div className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-mono text-[var(--muted-foreground)]">
                {step.output}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
