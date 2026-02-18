import { ConversationUI } from "@/components/conversation-ui";

export default function BuildPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Build a Playbook
        </h1>
        <p className="mt-1 text-[var(--muted-foreground)]">
          Describe your process and we&apos;ll turn it into an AI-powered
          playbook.
        </p>
      </div>

      <ConversationUI />
    </div>
  );
}
