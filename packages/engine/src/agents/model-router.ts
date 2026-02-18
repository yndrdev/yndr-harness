import type { ModelTier, Step } from "../types/harness.js";

/**
 * Smart model routing.
 * Routes steps to appropriate Claude models based on complexity.
 *
 * Routing logic:
 * - Opus: complex planning, multi-step reasoning, architecture decisions
 * - Sonnet: feature implementation, code generation, standard execution
 * - Haiku: simple tasks, validation, classification, guardrail checks
 */

const MODEL_MAP: Record<ModelTier, string> = {
  opus: "claude-opus-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  haiku: "claude-haiku-4-5-20251001",
};

export function resolveModel(step: Step, defaultModel?: string): string {
  // Explicit model override on the step
  if (step.model) {
    if (step.model in MODEL_MAP) {
      return MODEL_MAP[step.model as ModelTier];
    }
    return step.model;
  }

  // Default override
  if (defaultModel) return defaultModel;

  // Smart routing based on step characteristics
  return routeByStepType(step);
}

function routeByStepType(step: Step): string {
  // Validation steps are simple classification — use Haiku
  if (step.type === "validation") {
    return MODEL_MAP.haiku;
  }

  // Interactive steps with many questions need thoughtful responses — use Sonnet
  if (step.type === "interactive") {
    return MODEL_MAP.sonnet;
  }

  // Autonomous steps: check complexity
  if (step.type === "autonomous") {
    const actionCount = step.actions?.length ?? 0;

    // Many actions = complex = Sonnet
    if (actionCount > 5) return MODEL_MAP.sonnet;

    // Few actions or simple prompts = Haiku
    if (actionCount <= 2 && !step.prompt) return MODEL_MAP.haiku;

    return MODEL_MAP.sonnet;
  }

  return MODEL_MAP.sonnet;
}

export function getModelTier(modelId: string): ModelTier {
  if (modelId.includes("opus")) return "opus";
  if (modelId.includes("haiku")) return "haiku";
  return "sonnet";
}

export { MODEL_MAP };
