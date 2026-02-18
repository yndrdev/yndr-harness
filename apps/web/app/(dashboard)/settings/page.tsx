import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Configure your YNDR Harness workspace.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
            API Keys
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Manage your AI provider API keys.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="password"
              placeholder="sk-..."
              className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              readOnly
              value="••••••••••••••••"
            />
            <button className="h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
              Update
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
            Default Model
          </h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Choose the default AI model for playbook execution.
          </p>
          <select className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]">
            <option>Claude Sonnet 4.6</option>
            <option>Claude Haiku 4.5</option>
            <option>Claude Opus 4.6</option>
          </select>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-[var(--muted-foreground)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                More settings coming soon
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Notifications, team management, and integrations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
