// ── @yndr/engine — Core harness execution engine ──

// Parser
export { HarnessConfig } from "./parser/yaml-parser.js";

// Executor
export { RunEngine } from "./executor/run-engine.js";
export { StepRunner } from "./executor/step-runner.js";

// Guardrails
export { GuardrailEngine } from "./guardrails/engine.js";

// Agents
export { resolveModel, getModelTier, MODEL_MAP } from "./agents/model-router.js";
export {
  buildAutonomousPrompt,
  buildValidationPrompt,
  buildInteractiveProcessingPrompt,
  buildFollowUpPrompt,
} from "./agents/prompt-builder.js";

// Events
export { EventBus, engineEvents, ENGINE_EVENTS } from "./events/event-bus.js";

// Logger
export { ExecutionLog } from "./logger/execution-log.js";

// MCP
export { MCPConnector } from "./mcp/connector.js";
export type { MCPServerConfig, MCPConnection } from "./mcp/connector.js";

// Types
export type {
  Step,
  Guardrails,
  Identity,
  OutputConfig,
  ContextConfig,
  HarnessConfigRaw,
  ToolEntry,
  GuardrailCheckResult,
  GuardrailSummary,
  LogEntry,
  ExecutionLogData,
  StepResult,
  RunResult,
  ModelTier,
  RunOptions,
} from "./types/harness.js";

export { HarnessConfigSchema, StepSchema, GuardrailsSchema } from "./types/harness.js";
