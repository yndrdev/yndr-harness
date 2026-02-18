import yaml from "js-yaml";
import { HarnessConfigSchema, type HarnessConfigRaw, type ToolEntry } from "../types/harness.js";

/**
 * Parsed and validated harness configuration.
 * Ported from v1 HarnessConfig class (lines 43-156).
 */
export class HarnessConfig {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly identity: HarnessConfigRaw["identity"];
  readonly tools: HarnessConfigRaw["tools"];
  readonly steps: HarnessConfigRaw["steps"];
  readonly guardrails: HarnessConfigRaw["guardrails"];
  readonly output: HarnessConfigRaw["output"];
  readonly context: HarnessConfigRaw["context"];

  private constructor(config: HarnessConfigRaw) {
    this.name = config.harness.name;
    this.version = config.harness.version;
    this.description = config.harness.description;
    this.identity = config.identity;
    this.tools = config.tools;
    this.steps = config.steps;
    this.guardrails = config.guardrails;
    this.output = config.output;
    this.context = config.context;
  }

  /**
   * Parse and validate a YAML string into a HarnessConfig.
   * Throws ZodError if validation fails.
   */
  static fromYaml(yamlString: string): HarnessConfig {
    const raw = yaml.load(yamlString);
    const validated = HarnessConfigSchema.parse(raw);
    return new HarnessConfig(validated);
  }

  /**
   * Parse and validate a raw object (e.g. from JSONB storage).
   */
  static fromObject(obj: unknown): HarnessConfig {
    const validated = HarnessConfigSchema.parse(obj);
    return new HarnessConfig(validated);
  }

  /**
   * Serialize back to YAML string.
   */
  toYaml(): string {
    return yaml.dump({
      harness: { name: this.name, version: this.version, description: this.description },
      identity: this.identity,
      tools: this.tools,
      steps: this.steps,
      guardrails: this.guardrails,
      output: this.output,
      context: this.context,
    });
  }

  /**
   * Serialize to plain object (for JSONB storage).
   */
  toObject(): HarnessConfigRaw {
    return {
      harness: { name: this.name, version: this.version, description: this.description },
      identity: this.identity,
      tools: this.tools,
      steps: this.steps,
      guardrails: this.guardrails,
      output: this.output,
      context: this.context,
    };
  }

  /**
   * Build the system prompt from identity + guardrails.
   * Ported from v1 buildSystemPrompt() (lines 61-155).
   */
  buildSystemPrompt(): string {
    const sections: string[] = [];

    // Identity
    sections.push("# YOUR IDENTITY");
    sections.push(`Name: ${this.identity.name}`);
    sections.push(`Role: ${this.identity.role}`);
    if (this.identity.expertise) sections.push(`Expertise: ${this.identity.expertise}`);
    if (this.identity.tone) sections.push(`Communication Style: ${this.identity.tone}`);
    if (this.identity.context) sections.push(`Context: ${this.identity.context}`);
    sections.push("");

    // Guardrails
    sections.push("# GUARDRAILS — YOU MUST FOLLOW THESE AT ALL TIMES");
    sections.push("");

    if (this.guardrails.hard_stops.length > 0) {
      sections.push("## HARD STOPS (Immediately halt and alert the user if any of these are triggered)");
      for (const rule of this.guardrails.hard_stops) {
        sections.push(`- ${rule}`);
      }
      sections.push("");
    }

    if (this.guardrails.soft_warnings.length > 0) {
      sections.push("## WARNINGS (Flag these but continue if the user approves)");
      for (const rule of this.guardrails.soft_warnings) {
        sections.push(`- ${rule}`);
      }
      sections.push("");
    }

    if (this.guardrails.compliance.length > 0) {
      sections.push("## COMPLIANCE REQUIREMENTS");
      for (const rule of this.guardrails.compliance) {
        sections.push(`- ${rule}`);
      }
      sections.push("");
    }

    // Tools
    if (this.tools.allowed.length > 0) {
      sections.push("# TOOLS YOU CAN USE");
      for (const tool of this.tools.allowed) {
        sections.push(`- ${formatToolEntry(tool)}`);
      }
      sections.push("");
    }

    if (this.tools.blocked.length > 0) {
      sections.push("# TOOLS YOU MUST NOT USE");
      for (const tool of this.tools.blocked) {
        sections.push(`- ${formatToolEntry(tool)}`);
      }
      sections.push("");
    }

    // Output expectations
    if (this.output.format) {
      sections.push("# OUTPUT FORMAT");
      sections.push(`Deliver your final output as: ${this.output.format}`);
      if (this.output.includes) {
        sections.push("Include the following:");
        for (const item of this.output.includes) {
          sections.push(`- ${formatToolEntry(item)}`);
        }
      }
      sections.push("");
    }

    // Preloaded context
    if (this.context.preloaded?.length) {
      sections.push("# PRELOADED CONTEXT");
      for (const ctx of this.context.preloaded) {
        sections.push(`- ${ctx}`);
      }
      sections.push("");
    }

    return sections.join("\n");
  }
}

function formatToolEntry(entry: ToolEntry): string {
  if (typeof entry === "string") return entry;
  const key = Object.keys(entry)[0];
  return `${key}: ${entry[key]}`;
}
