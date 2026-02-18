import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-sm text-[var(--muted-foreground)]">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--yndr-red)]" />
          AI-Powered Process Automation
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight text-[var(--foreground)] sm:text-6xl">
          <span className="text-[var(--yndr-red)]">YNDR</span> Harness
        </h1>

        <p className="mb-10 text-lg text-[var(--muted-foreground)] sm:text-xl">
          Turn any process into an AI-powered playbook.
          <br />
          Build, run, and automate with guardrails built in.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/build"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[var(--yndr-red)] px-8 text-base font-medium text-white transition-colors hover:bg-[#d13a52]"
          >
            Build a Playbook
          </Link>
          <Link
            href="/playbooks"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-8 text-base font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
          >
            Browse Playbooks
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 text-sm text-[var(--muted-foreground)]">
        Built with YNDR Engine
      </div>
    </div>
  );
}
