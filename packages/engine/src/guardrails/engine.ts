import type { Guardrails, GuardrailCheckResult, GuardrailSummary } from "../types/harness.js";

/**
 * Guardrail enforcement engine.
 * Ported from v1 GuardrailEngine class (lines 159-219).
 * Upgraded: deterministic checks + optional AI classification.
 */
export class GuardrailEngine {
  private readonly hardStops: string[];
  private readonly softWarnings: string[];
  private readonly compliance: string[];
  private readonly violations: Array<{ rule: string; timestamp: string }> = [];
  private readonly warnings: Array<{ rule: string; timestamp: string }> = [];

  constructor(guardrails: Guardrails) {
    this.hardStops = guardrails.hard_stops;
    this.softWarnings = guardrails.soft_warnings;
    this.compliance = guardrails.compliance;
  }

  /**
   * Check a response against all guardrails.
   * Returns whether execution should be blocked.
   */
  checkResponse(response: string): GuardrailCheckResult {
    const lower = response.toLowerCase();
    const result: GuardrailCheckResult = {
      blocked: false,
      warnings: [],
      violations: [],
    };

    // Check hard stops
    for (const rule of this.hardStops) {
      if (this.checkViolation(lower, rule)) {
        result.blocked = true;
        result.violations.push(rule);
        this.violations.push({ rule, timestamp: new Date().toISOString() });
      }
    }

    // Check soft warnings
    for (const rule of this.softWarnings) {
      if (this.checkWarning(lower, rule)) {
        result.warnings.push(rule);
        this.warnings.push({ rule, timestamp: new Date().toISOString() });
      }
    }

    return result;
  }

  /**
   * Deterministic violation checks.
   * In production, this can be augmented with AI classification via Haiku.
   */
  private checkViolation(text: string, rule: string): boolean {
    const lowerRule = rule.toLowerCase();

    // API key / credential exposure
    if (lowerRule.includes("api key") || lowerRule.includes("credential") || lowerRule.includes("password")) {
      if (/[a-z]{2,}_[a-zA-Z0-9]{20,}/.test(text)) return true;
      if (/sk-[a-zA-Z0-9]{20,}/.test(text)) return true;
      if (/eyJ[a-zA-Z0-9_-]{10,}/.test(text)) return true;
    }

    // Destructive operations
    if (lowerRule.includes("delete") && lowerRule.includes("production")) {
      if (text.includes("drop table") || text.includes("delete from") || text.includes("truncate")) return true;
    }

    // PII / PHI
    if (lowerRule.includes("patient") || lowerRule.includes("health") || lowerRule.includes("hipaa")) {
      if (/\b(ssn|social security|dob|date of birth)\b/.test(text)) return true;
    }

    return false;
  }

  /**
   * Soft warning checks.
   */
  private checkWarning(text: string, rule: string): boolean {
    const lowerRule = rule.toLowerCase();

    if (lowerRule.includes("cost") && /\$\d{3,}/.test(text)) return true;
    if (lowerRule.includes("vulnerability") && text.includes("vulnerability")) return true;
    if (lowerRule.includes("steps") && lowerRule.includes("15")) {
      // Count numbered items that might indicate many steps
      const numberedItems = text.match(/^\d+\./gm);
      if (numberedItems && numberedItems.length > 15) return true;
    }

    return false;
  }

  getSummary(): GuardrailSummary {
    return {
      totalViolations: this.violations.length,
      totalWarnings: this.warnings.length,
      violations: [...this.violations],
      warnings: [...this.warnings],
    };
  }

  reset(): void {
    this.violations.length = 0;
    this.warnings.length = 0;
  }
}
