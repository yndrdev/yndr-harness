import { z } from "zod";

// ── Zod Schemas ──

export const ToolEntrySchema = z.union([
  z.string(),
  z.record(z.string(), z.string()),
]);

export const StepSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/, "Step IDs must be snake_case"),
  name: z.string(),
  type: z.enum(["interactive", "autonomous", "validation"]).default("autonomous"),
  prompt: z.string().optional(),
  questions: z.array(z.string()).optional(),
  actions: z.array(z.string()).optional(),
  checks: z.array(z.string()).optional(),
  behavior: z.string().optional(),
  depends_on: z.union([z.string(), z.array(z.string())]).optional(),
  output: z.string().optional(),
  max_turns: z.number().int().positive().optional(),
  model: z.string().optional(),
});

export const GuardrailsSchema = z.object({
  hard_stops: z.array(z.string()).default([]),
  soft_warnings: z.array(z.string()).default([]),
  compliance: z.array(z.string()).default([]),
});

export const IdentitySchema = z.object({
  name: z.string().default("AI Assistant"),
  role: z.string().default("General assistant"),
  expertise: z.string().optional(),
  tone: z.string().optional(),
  context: z.string().optional(),
});

export const OutputSchema = z.object({
  format: z.string().optional(),
  includes: z.array(ToolEntrySchema).optional(),
  delivery: z.array(z.string()).optional(),
});

export const ContextSchema = z.object({
  preloaded: z.array(z.string()).optional(),
  persistent: z.array(z.string()).optional(),
});

export const HarnessConfigSchema = z.object({
  harness: z.object({
    name: z.string(),
    version: z.string().default("1.0"),
    description: z.string().default(""),
  }),
  identity: IdentitySchema.default({}),
  tools: z.object({
    allowed: z.array(ToolEntrySchema).default([]),
    blocked: z.array(ToolEntrySchema).default([]),
  }).default({}),
  steps: z.array(StepSchema).min(1, "At least one step is required"),
  guardrails: GuardrailsSchema.default({}),
  output: OutputSchema.default({}),
  context: ContextSchema.default({}),
});

// ── Inferred Types ──

export type ToolEntry = z.infer<typeof ToolEntrySchema>;
export type Step = z.infer<typeof StepSchema>;
export type Guardrails = z.infer<typeof GuardrailsSchema>;
export type Identity = z.infer<typeof IdentitySchema>;
export type OutputConfig = z.infer<typeof OutputSchema>;
export type ContextConfig = z.infer<typeof ContextSchema>;
export type HarnessConfigRaw = z.infer<typeof HarnessConfigSchema>;

// ── Runtime Types ──

export interface GuardrailCheckResult {
  blocked: boolean;
  warnings: string[];
  violations: string[];
}

export interface GuardrailSummary {
  totalViolations: number;
  totalWarnings: number;
  violations: Array<{ rule: string; timestamp: string }>;
  warnings: Array<{ rule: string; timestamp: string }>;
}

export interface LogEntry {
  timestamp: string;
  stepId: string;
  type: "input" | "output" | "guardrail" | "error" | "decision";
  content: unknown;
}

export interface ExecutionLogData {
  harness: string;
  startTime: string;
  endTime: string;
  entries: LogEntry[];
  stepOutputs: Record<string, string>;
}

export interface StepResult {
  stepId: string;
  output: string;
  status: "completed" | "skipped" | "failed" | "blocked";
  guardrailCheck?: GuardrailCheckResult;
  duration: number;
  model?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export interface RunResult {
  harnessName: string;
  startTime: string;
  endTime: string;
  status: "completed" | "halted" | "failed";
  stepResults: Record<string, StepResult>;
  guardrailSummary: GuardrailSummary;
  totalTokens: { input: number; output: number };
}

export type ModelTier = "opus" | "sonnet" | "haiku";

export interface RunOptions {
  model?: string;
  verbose?: boolean;
  maxTurns?: number;
  onStepStart?: (stepId: string, stepName: string) => void;
  onStepComplete?: (result: StepResult) => void;
  onGuardrailViolation?: (stepId: string, violations: string[]) => void;
  onLog?: (entry: LogEntry) => void;
  userInputHandler?: (question: string) => Promise<string>;
}
