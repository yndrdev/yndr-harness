"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your playbook builder. Describe the process you want to automate, and I'll help you turn it into a structured playbook with steps and guardrails.",
  },
];

export function ConversationUI({
  messages: externalMessages,
  onSendMessage,
  isLoading = false,
}: {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
} = {}) {
  const [internalMessages, setInternalMessages] =
    useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  const messages = externalMessages ?? internalMessages;

  function handleSend() {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    if (onSendMessage) {
      onSendMessage(input.trim());
    } else {
      setInternalMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I've analyzed your process. Let me break it down into structured steps with appropriate guardrails. This is a placeholder response — the engine integration will provide real AI responses.",
        },
      ]);
    }
    setInput("");
  }

  return (
    <div className="flex flex-1 flex-col rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex-1 overflow-auto p-4">
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
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-[var(--muted)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce [animation-delay:0.15s]">
                    .
                  </span>
                  <span className="animate-bounce [animation-delay:0.3s]">
                    .
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Describe a process to automate..."
            className="h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--yndr-red)] text-white transition-colors hover:bg-[#d13a52] disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
