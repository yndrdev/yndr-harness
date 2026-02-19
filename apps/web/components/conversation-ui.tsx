"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Check, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function extractYaml(text: string): string | null {
  const match = text.match(/```yaml\n([\s\S]*?)```/);
  return match ? match[1] : null;
}

function parseYamlLite(yaml: string): Record<string, unknown> {
  // Extract top-level fields for metadata — not a full parser
  const result: Record<string, unknown> = {};
  const nameMatch = yaml.match(/^\s*name:\s*"?(.+?)"?\s*$/m);
  const descMatch = yaml.match(/^\s*description:\s*"?(.+?)"?\s*$/m);
  if (nameMatch) result.name = nameMatch[1];
  if (descMatch) result.description = descMatch[1];

  // Count steps
  const stepMatches = yaml.match(/^\s*- id:/gm);
  result.stepCount = stepMatches?.length ?? 0;

  // Extract guardrails
  const hardStops: string[] = [];
  const softWarnings: string[] = [];
  const compliance: string[] = [];

  let section = "";
  for (const line of yaml.split("\n")) {
    if (line.match(/^\s*hard_stops:/)) section = "hard";
    else if (line.match(/^\s*soft_warnings:/)) section = "soft";
    else if (line.match(/^\s*compliance:/)) section = "compliance";
    else if (line.match(/^\s*\w+:/) && !line.match(/^\s*-/)) section = "";
    else if (section && line.match(/^\s*-\s*"?(.+)"?\s*$/)) {
      const val = line.replace(/^\s*-\s*"?/, "").replace(/"?\s*$/, "");
      if (section === "hard") hardStops.push(val);
      else if (section === "soft") softWarnings.push(val);
      else if (section === "compliance") compliance.push(val);
    }
  }

  result.guardrails = { hard_stops: hardStops, soft_warnings: softWarnings, compliance };
  return result;
}

export function ConversationUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey! I'm your playbook builder. Tell me about a process you want to automate — what does it do, and what's the goal? I'll interview you about it and then generate a ready-to-run playbook.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${errMsg}. Check that ANTHROPIC_API_KEY is set.` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  async function handleSavePlaybook() {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const yaml = extractYaml(lastAssistant.content);
    if (!yaml) return;

    setIsSaving(true);

    try {
      const parsed = parseYamlLite(yaml);
      const name = (parsed.name as string) || "Untitled Playbook";
      const description = (parsed.description as string) || "";

      const response = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          yaml_source: yaml,
          config: {
            steps: Array.from({ length: parsed.stepCount as number }, (_, i) => ({
              id: `step_${i + 1}`,
            })),
            guardrails: parsed.guardrails,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Save failed");
      }

      const data = await response.json();
      setSavedId(data.id);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to save: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Check if the latest assistant message contains YAML
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const hasYaml = lastAssistant ? !!extractYaml(lastAssistant.content) : false;

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--yndr-red)] text-white"
                    : "bg-[var(--muted)] text-[var(--foreground)]"
                }`}
              >
                <MessageContent content={msg.content} />
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.15s]">.</span>
                  <span className="animate-bounce [animation-delay:0.3s]">.</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save playbook bar */}
      {hasYaml && !isStreaming && (
        <div className="border-t border-[var(--border)] bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-400">
              Playbook generated! Save it to your library.
            </p>
            {savedId ? (
              <a
                href={`/playbooks/${savedId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Check size={14} />
                View Playbook
              </a>
            ) : (
              <button
                onClick={handleSavePlaybook}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Playbook"
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe a process to automate..."
            disabled={isStreaming}
            className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--yndr-red)] text-white transition-colors hover:bg-[#d13a52] disabled:opacity-50"
          >
            {isStreaming ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  if (!content) return null;

  // Split by code blocks to render YAML nicely
  const parts = content.split(/(```yaml[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```yaml")) {
          const code = part.replace(/^```yaml\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="mt-2 overflow-x-auto rounded-md bg-[var(--background)] p-3 text-xs leading-relaxed text-emerald-400"
            >
              <code>{code}</code>
            </pre>
          );
        }
        // Render paragraphs with line breaks
        return (
          <span key={i} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </>
  );
}
