interface Step {
  id: string;
  name: string;
  description: string;
}

export function StepDiagram({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="relative flex items-start gap-4">
          {/* Connector line */}
          {i < steps.length - 1 && (
            <div className="absolute left-5 top-10 h-[calc(100%-8px)] w-px bg-[var(--border)]" />
          )}

          {/* Step number circle */}
          <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-sm font-semibold text-[var(--yndr-red)]">
            {i + 1}
          </div>

          {/* Step content */}
          <div className="flex-1 pb-6">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--yndr-red)]/30">
              <h3 className="mb-1 text-sm font-medium text-[var(--foreground)]">
                {step.name}
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
