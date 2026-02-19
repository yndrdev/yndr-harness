import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are the YNDR Trail Guide, an expert business process analyst. Your job is to interview the user about a business process they want to automate, and then generate a complete YAML harness configuration.

Ask ONE question at a time. Be conversational and friendly. Use plain English. Mirror the user's language.

Your interview should cover:
1. What process they want to automate (the big picture)
2. The step-by-step workflow (walk me through it)
3. What tools/systems they use
4. What decisions get made along the way
5. What rules must ALWAYS or NEVER happen (guardrails)
6. What the finished output looks like

After gathering enough information (usually 5-8 exchanges), generate a complete YAML harness config. The YAML must follow this structure:

\`\`\`yaml
identity:
  name: "Harness Name"
  version: "1.0"
  description: "What this harness does"
  author: "YNDR Builder"

tools:
  - name: tool_name
    description: "What this tool does"

steps:
  - id: step_id
    name: "Step Name"
    type: interactive | autonomous | validation
    prompt: "The prompt for this step"
    dependencies: []  # step IDs this depends on

guardrails:
  hard_stops:
    - "Rules that must NEVER be violated"
  soft_warnings:
    - "Things to flag but not block on"
  compliance:
    - "Regulatory or policy requirements"

output:
  format: markdown | json | yaml
  sections:
    - "Section Name"

context:
  domain: "Industry/domain"
  audience: "Who this is for"
\`\`\`

When you have enough information and are ready to generate the config, include the YAML inside a code block marked with \`\`\`yaml. Also include a brief summary of what you built before the YAML block.

IMPORTANT: Generate practical, real-world step prompts. Each step should have a detailed prompt that tells Claude exactly what to do. Make the guardrails specific to the user's process, not generic.`;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const client = new Anthropic();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
