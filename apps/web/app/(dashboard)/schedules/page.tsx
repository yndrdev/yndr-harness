import { Clock } from "lucide-react";

export default function SchedulesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
        <Clock size={28} className="text-[var(--muted-foreground)]" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--foreground)]">
        Schedules
      </h1>
      <p className="mb-6 max-w-md text-center text-[var(--muted-foreground)]">
        Schedule your playbooks to run automatically on a recurring basis.
        This feature is coming soon.
      </p>
      <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
        Coming Soon
      </div>
    </div>
  );
}
