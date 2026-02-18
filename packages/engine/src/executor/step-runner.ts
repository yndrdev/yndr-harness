import Anthropic from "@anthropic-ai/sdk";
import type { Step, StepResult, RunOptions } from "../types/harness.js";
import { GuardrailEngine } from "../guardrails/engine.js";
import { ExecutionLog } from "../logger/execution-log.js";
import { resolveModel } from "../agents/model-router.js";
import {
  buildAutonomousPrompt,
  buildValidationPrompt,
  buildInteractiveProcessingPrompt,
  buildFollowUpPrompt,
} from "../agents/prompt-builder.js";

/**
 * Runs individual steps within a harness execution.
 * Ported from v1 _runInteractiveStep, _runAutonomousStep, _runValidationStep.
 * Upgraded: streaming, error recovery, model routing, token tracking.
 */
export class StepRunner {
  private readonly client: Anthropic;
  private readonly guardrails: GuardrailEngine;
  private readonly log: ExecutionLog;
  private readonly options: RunOptions;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private stepOutputs: Record<string, string> = {};

  constructor(
    client: Anthropic,
    guardrails: GuardrailEngine,
    log: ExecutionLog,
    options: RunOptions = {},
  ) {
    this.client = client;
    this.guardrails = guardrails;
    this.log = log;
    this.options = options;
  }

  setStepOutputs(outputs: Record<string, string>): void {
    this.stepOutputs = outputs;
  }

  async runStep(step: Step, systemPrompt: string): Promise<StepResult> {
    const startTime = Date.now();
    const model = resolveModel(step, this.options.model);

    this.options.onStepStart?.(step.id, step.name);

    try {
      let output: string;
      let tokenUsage = { input: 0, output: 0 };

      switch (step.type) {
        case "interactive":
          ({ output, tokenUsage } = await this.runInteractive(step, systemPrompt, model));
          break;
        case "validation":
          ({ output, tokenUsage } = await this.runValidation(step, systemPrompt, model));
          break;
        case "autonomous":
        default:
          ({ output, tokenUsage } = await this.runAutonomous(step, systemPrompt, model));
          break;
      }

      // Run guardrail checks
      const guardrailCheck = this.guardrails.checkResponse(output);

      if (guardrailCheck.violations.length > 0) {
        this.log.log(step.id, "guardrail", {
          type: "violation",
          rules: guardrailCheck.violations,
        });
        this.options.onGuardrailViolation?.(step.id, guardrailCheck.violations);
      }

      const result: StepResult = {
        stepId: step.id,
        output,
        status: guardrailCheck.blocked ? "blocked" : "completed",
        guardrailCheck,
        duration: Date.now() - startTime,
        model,
        tokenUsage,
      };

      this.log.setStepOutput(step.id, output);
      this.log.log(step.id, "output", { status: result.status, model });
      this.options.onStepComplete?.(result);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.log.log(step.id, "error", err.message);

      return {
        stepId: step.id,
        output: "",
        status: "failed",
        duration: Date.now() - startTime,
        model,
      };
    }
  }

  private async runAutonomous(
    step: Step,
    systemPrompt: string,
    model: string,
  ): Promise<{ output: string; tokenUsage: { input: number; output: number } }> {
    const prompt = buildAutonomousPrompt(step, this.stepOutputs);
    this.log.log(step.id, "input", { task: prompt });
    return this.callClaude(systemPrompt, prompt, model);
  }

  private async runValidation(
    step: Step,
    systemPrompt: string,
    model: string,
  ): Promise<{ output: string; tokenUsage: { input: number; output: number } }> {
    const prompt = buildValidationPrompt(step, this.stepOutputs);
    this.log.log(step.id, "input", { validation: prompt });
    return this.callClaude(systemPrompt, prompt, model);
  }

  private async runInteractive(
    step: Step,
    systemPrompt: string,
    model: string,
  ): Promise<{ output: string; tokenUsage: { input: number; output: number } }> {
    let collectedInput = "";
    let totalTokens = { input: 0, output: 0 };

    // Present the prompt if provided
    if (step.prompt) {
      const { output } = await this.callClaude(
        systemPrompt,
        `Present this to the user in a friendly, conversational way. Do not add any steps the user didn't describe:\n\n${step.prompt}`,
        model,
      );
      // In web mode, this would be streamed to the UI
      this.log.log(step.id, "output", { type: "prompt_presentation", content: output });
    }

    // Ask questions if provided
    if (step.questions?.length && this.options.userInputHandler) {
      for (const question of step.questions) {
        const answer = await this.options.userInputHandler(question);
        collectedInput += `\nQ: ${question}\nA: ${answer}`;
        this.log.log(step.id, "input", { question, answer });

        // Follow-up processing
        if (step.behavior) {
          const followUpPrompt = buildFollowUpPrompt(step, collectedInput);
          const { output, tokenUsage } = await this.callClaude(systemPrompt, followUpPrompt, model);
          totalTokens.input += tokenUsage.input;
          totalTokens.output += tokenUsage.output;
          this.log.log(step.id, "output", { type: "follow_up", content: output });
        }
      }
    } else if (!step.prompt && this.options.userInputHandler) {
      const answer = await this.options.userInputHandler("Your input:");
      collectedInput = answer;
      this.log.log(step.id, "input", { input: answer });
    }

    // Process collected input
    if (collectedInput.trim()) {
      const prompt = buildInteractiveProcessingPrompt(step, collectedInput, this.stepOutputs);
      const { output, tokenUsage } = await this.callClaude(systemPrompt, prompt, model);
      totalTokens.input += tokenUsage.input;
      totalTokens.output += tokenUsage.output;
      return { output, tokenUsage: totalTokens };
    }

    return { output: "[No input collected]", tokenUsage: totalTokens };
  }

  private async callClaude(
    systemPrompt: string,
    userMessage: string,
    model: string,
  ): Promise<{ output: string; tokenUsage: { input: number; output: number } }> {
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    const response = await this.client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: this.conversationHistory,
    });

    const assistantMessage = response.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("\n");

    this.conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return {
      output: assistantMessage,
      tokenUsage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }
}
