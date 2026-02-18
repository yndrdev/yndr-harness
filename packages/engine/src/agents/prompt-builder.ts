import type { Step } from "../types/harness.js";

/**
 * Builds prompts for different step types.
 * Ported from v1 HarnessOrchestrator methods.
 */

export function buildAutonomousPrompt(
  step: Step,
  previousOutputs: Record<string, string>,
): string {
  const parts: string[] = [];

  parts.push(`Execute step: "${step.name}"\n`);

  if (step.actions?.length) {
    parts.push("Actions to perform:");
    step.actions.forEach((action, i) => {
      parts.push(`${i + 1}. ${action}`);
    });
    parts.push("");
  }

  if (step.prompt) {
    parts.push(`Instructions: ${step.prompt}\n`);
  }

  appendPreviousOutputs(parts, previousOutputs);

  if (step.output) {
    parts.push(`Expected output: ${step.output}`);
  }

  return parts.join("\n");
}

export function buildValidationPrompt(
  step: Step,
  previousOutputs: Record<string, string>,
): string {
  const parts: string[] = [];

  parts.push(`You are performing a validation check: "${step.name}"\n`);
  parts.push("Check the following criteria and report PASS or FAIL for each:\n");

  if (step.checks?.length) {
    step.checks.forEach((check, i) => {
      parts.push(`${i + 1}. ${check}`);
    });
    parts.push("");
  }

  appendPreviousOutputs(parts, previousOutputs, 1500);

  parts.push("For each check, respond with:");
  parts.push("- PASS: [reason]");
  parts.push("- FAIL: [reason and recommended fix]");
  parts.push("\nThen provide an overall validation summary.");

  return parts.join("\n");
}

export function buildInteractiveProcessingPrompt(
  step: Step,
  collectedInput: string,
  previousOutputs: Record<string, string>,
): string {
  const parts: string[] = [];

  parts.push(`Process this input from the interactive step "${step.name}":`);
  parts.push(collectedInput);

  appendPreviousOutputs(parts, previousOutputs);

  parts.push("\nProvide a structured summary of what you understood and any outputs for this step.");

  return parts.join("\n");
}

export function buildFollowUpPrompt(
  step: Step,
  collectedInput: string,
): string {
  const parts: string[] = [];

  parts.push("The user answered a question. Here is the conversation so far:");
  parts.push(collectedInput);

  if (step.behavior) {
    parts.push(`\nBehavior instructions: ${step.behavior}`);
  }

  parts.push("\nProvide a brief acknowledgment or ask a follow-up question if needed. Keep it concise.");

  return parts.join("\n");
}

function appendPreviousOutputs(
  parts: string[],
  outputs: Record<string, string>,
  maxPreview = 1000,
): void {
  const keys = Object.keys(outputs);
  if (keys.length === 0) return;

  parts.push("\n# Context from previous steps:");
  for (const [id, output] of Object.entries(outputs)) {
    const preview = output.slice(0, maxPreview);
    parts.push(`## ${id}:`);
    parts.push(preview);
    if (output.length > maxPreview) parts.push("...(truncated)");
    parts.push("");
  }
}
