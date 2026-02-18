import Anthropic from "@anthropic-ai/sdk";
import type { RunResult, RunOptions, Step } from "../types/harness.js";
import { HarnessConfig } from "../parser/yaml-parser.js";
import { GuardrailEngine } from "../guardrails/engine.js";
import { ExecutionLog } from "../logger/execution-log.js";
import { StepRunner } from "./step-runner.js";
import { EventBus, ENGINE_EVENTS } from "../events/event-bus.js";

/**
 * Main harness execution engine.
 * Ported from v1 HarnessOrchestrator.run() (lines 257-407).
 * Upgraded: event-driven, streaming-ready, error recovery.
 */
export class RunEngine {
  private readonly config: HarnessConfig;
  private readonly client: Anthropic;
  private readonly guardrails: GuardrailEngine;
  private readonly log: ExecutionLog;
  private readonly stepRunner: StepRunner;
  private readonly events: EventBus;
  private readonly options: RunOptions;
  private readonly stepOutputs: Record<string, string> = {};

  constructor(config: HarnessConfig, options: RunOptions = {}) {
    this.config = config;
    this.options = options;
    this.client = new Anthropic();
    this.guardrails = new GuardrailEngine(config.guardrails);
    this.events = new EventBus();

    this.log = new ExecutionLog(config.name, (entry) => {
      this.events.emit(ENGINE_EVENTS.LOG_ENTRY, entry);
      options.onLog?.(entry);
    });

    this.stepRunner = new StepRunner(
      this.client,
      this.guardrails,
      this.log,
      options,
    );
  }

  /**
   * Execute the entire harness from start to finish.
   */
  async run(): Promise<RunResult> {
    const startTime = new Date().toISOString();
    const systemPrompt = this.config.buildSystemPrompt();
    const totalTokens = { input: 0, output: 0 };

    await this.events.emit(ENGINE_EVENTS.RUN_START, {
      harness: this.config.name,
      steps: this.config.steps.length,
    });

    let halted = false;

    for (const step of this.config.steps) {
      // Check dependencies
      if (step.depends_on) {
        const deps = Array.isArray(step.depends_on)
          ? step.depends_on
          : [step.depends_on];
        const missingDeps = deps.filter((d) => !(d in this.stepOutputs));

        if (missingDeps.length > 0) {
          this.log.log(step.id, "error", `Skipped: missing dependencies ${missingDeps.join(", ")}`);
          continue;
        }
      }

      await this.events.emit(ENGINE_EVENTS.STEP_START, {
        stepId: step.id,
        stepName: step.name,
        stepType: step.type,
      });

      // Update step runner with current outputs
      this.stepRunner.setStepOutputs(this.stepOutputs);

      const result = await this.stepRunner.runStep(step, systemPrompt);

      // Track tokens
      if (result.tokenUsage) {
        totalTokens.input += result.tokenUsage.input;
        totalTokens.output += result.tokenUsage.output;
      }

      // Store output
      if (result.status === "completed" || result.status === "blocked") {
        this.stepOutputs[step.id] = result.output;
      }

      await this.events.emit(ENGINE_EVENTS.STEP_COMPLETE, result);

      // Check if execution should halt
      if (result.status === "blocked") {
        halted = true;
        await this.events.emit(ENGINE_EVENTS.GUARDRAIL_VIOLATION, {
          stepId: step.id,
          violations: result.guardrailCheck?.violations,
        });
        break;
      }

      if (result.status === "failed") {
        // In web mode, error recovery could retry or ask user
        // For now, continue to next step (matching v1 behavior)
        this.log.log(step.id, "error", "Step failed, continuing...");
      }
    }

    const endTime = new Date().toISOString();
    const guardrailSummary = this.guardrails.getSummary();

    const runResult: RunResult = {
      harnessName: this.config.name,
      startTime,
      endTime,
      status: halted ? "halted" : "completed",
      stepResults: Object.fromEntries(
        this.config.steps
          .filter((s) => s.id in this.stepOutputs)
          .map((s) => [s.id, {
            stepId: s.id,
            output: this.stepOutputs[s.id],
            status: "completed" as const,
            duration: 0,
          }]),
      ),
      guardrailSummary,
      totalTokens,
    };

    await this.events.emit(ENGINE_EVENTS.RUN_COMPLETE, runResult);

    return runResult;
  }

  /**
   * Get the event bus for subscribing to engine events.
   */
  getEvents(): EventBus {
    return this.events;
  }

  /**
   * Get the execution log.
   */
  getLog(): ExecutionLog {
    return this.log;
  }
}
