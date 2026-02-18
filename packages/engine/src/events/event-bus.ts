type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

/**
 * Internal event bus for engine lifecycle events.
 * Used by scheduler integration and real-time streaming.
 */
export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const handlerSet = this.handlers.get(event)!;
    handlerSet.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlerSet.delete(handler as EventHandler);
    };
  }

  async emit<T = unknown>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const promises = [...handlers].map((handler) => handler(data));
    await Promise.allSettled(promises);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}

// Singleton for engine-wide events
export const engineEvents = new EventBus();

// Event type constants
export const ENGINE_EVENTS = {
  RUN_START: "run:start",
  RUN_COMPLETE: "run:complete",
  RUN_ERROR: "run:error",
  STEP_START: "step:start",
  STEP_COMPLETE: "step:complete",
  STEP_ERROR: "step:error",
  GUARDRAIL_CHECK: "guardrail:check",
  GUARDRAIL_VIOLATION: "guardrail:violation",
  LOG_ENTRY: "log:entry",
} as const;
