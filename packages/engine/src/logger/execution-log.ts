import type { LogEntry, ExecutionLogData } from "../types/harness.js";

/**
 * Structured execution logger.
 * Ported from v1 ExecutionLog class (lines 222-254).
 * Upgraded: emits events for real-time streaming, supports DB persistence.
 */
export class ExecutionLog {
  readonly harnessName: string;
  readonly startTime: string;
  private readonly entries: LogEntry[] = [];
  private readonly stepOutputs: Record<string, string> = {};
  private readonly onLog?: (entry: LogEntry) => void;

  constructor(harnessName: string, onLog?: (entry: LogEntry) => void) {
    this.harnessName = harnessName;
    this.startTime = new Date().toISOString();
    this.onLog = onLog;
  }

  log(stepId: string, type: LogEntry["type"], content: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      stepId,
      type,
      content,
    };
    this.entries.push(entry);
    this.onLog?.(entry);
  }

  setStepOutput(stepId: string, output: string): void {
    this.stepOutputs[stepId] = output;
  }

  getStepOutput(stepId: string): string | undefined {
    return this.stepOutputs[stepId];
  }

  getAllOutputs(): Record<string, string> {
    return { ...this.stepOutputs };
  }

  toJSON(): ExecutionLogData {
    return {
      harness: this.harnessName,
      startTime: this.startTime,
      endTime: new Date().toISOString(),
      entries: [...this.entries],
      stepOutputs: { ...this.stepOutputs },
    };
  }
}
