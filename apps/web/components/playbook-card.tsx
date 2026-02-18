import Link from "next/link";

export function PlaybookCard({
  name,
  description,
  stepCount,
  guardrailCount,
  href,
}: {
  name: string;
  description: string;
  stepCount: number;
  guardrailCount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--yndr-red)]/50 hover:bg-[var(--muted)]/50"
    >
      <h3 className="mb-1 text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--yndr-red)]">
        {name}
      </h3>
      <p className="mb-4 line-clamp-2 flex-1 text-sm text-[var(--muted-foreground)]">
        {description}
      </p>
      <div className="flex gap-2">
        <span className="inline-flex items-center rounded-md bg-[var(--secondary)]/30 px-2 py-0.5 text-xs font-medium text-[var(--foreground)]">
          {stepCount} steps
        </span>
        <span className="inline-flex items-center rounded-md bg-[var(--yndr-red)]/10 px-2 py-0.5 text-xs font-medium text-[var(--yndr-red)]">
          {guardrailCount} guardrails
        </span>
      </div>
    </Link>
  );
}
