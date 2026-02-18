#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { Command } from "commander";
import Anthropic from "@anthropic-ai/sdk";
import {
  HarnessConfig,
  RunEngine,
  type RunOptions,
  type StepResult,
  type LogEntry,
} from "@yndr/engine";

// ── YNDR Brand Colors ──

const YNDR_RED = chalk.hex("#E94560");
const YNDR_BLUE = chalk.hex("#0F3460");
const YNDR_DARK = chalk.hex("#1A1A2E");
const DIM = chalk.gray;
const SUCCESS = chalk.green;
const WARN = chalk.yellow;
const ERR = chalk.red;

// ── ASCII Banner ──

function showBanner() {
  console.log("");
  console.log(YNDR_RED("  ╔═══════════════════════════════════════╗"));
  console.log(YNDR_RED("  ║") + chalk.white.bold("   YNDR HARNESS ORCHESTRATOR  v2.0    ") + YNDR_RED("║"));
  console.log(YNDR_RED("  ║") + DIM("   Powered by Claude · Built by YNDR   ") + YNDR_RED("║"));
  console.log(YNDR_RED("  ╚═══════════════════════════════════════╝"));
  console.log("");
}

// ── Pretty Print Claude Response ──

function printClaudeResponse(text: string) {
  const lines = text.split("\n");
  console.log(YNDR_RED("  │"));
  for (const line of lines) {
    if (line.startsWith("#")) {
      console.log(YNDR_RED("  │  ") + YNDR_BLUE.bold(line));
    } else if (line.startsWith("- ✅") || line.startsWith("✅")) {
      console.log(YNDR_RED("  │  ") + SUCCESS(line));
    } else if (line.startsWith("- ❌") || line.startsWith("❌")) {
      console.log(YNDR_RED("  │  ") + ERR(line));
    } else if (line.startsWith("- ⚠") || line.startsWith("⚠")) {
      console.log(YNDR_RED("  │  ") + WARN(line));
    } else if (line.startsWith("- 🛑")) {
      console.log(YNDR_RED("  │  ") + ERR(line));
    } else if (line.trim() === "") {
      console.log(YNDR_RED("  │"));
    } else {
      console.log(YNDR_RED("  │  ") + chalk.white(line));
    }
  }
}

// ══════════════════════════════════════════════════════════════
// COMMANDS
// ══════════════════════════════════════════════════════════════

// ── run ──

async function runCommand(configPath: string, opts: { verbose?: boolean; model?: string }) {
  const resolved = path.resolve(configPath);

  if (!fs.existsSync(resolved)) {
    console.log(ERR(`\n  Config not found: ${resolved}\n`));
    process.exit(1);
  }

  const yamlSource = fs.readFileSync(resolved, "utf8");
  const config = HarnessConfig.fromYaml(yamlSource);

  showBanner();

  console.log(YNDR_BLUE("  Harness: ") + chalk.white.bold(config.name));
  console.log(YNDR_BLUE("  Version: ") + chalk.white(config.version));
  if (config.description) {
    console.log(YNDR_BLUE("  Description: ") + DIM(config.description));
  }
  console.log(DIM(`  Steps: ${config.steps.length}`));
  console.log(
    DIM(
      `  Guardrails: ${config.guardrails.hard_stops.length} hard stops, ${config.guardrails.soft_warnings.length} warnings`,
    ),
  );
  console.log("");
  console.log(chalk.white("  ─────────────────────────────────────────"));
  console.log("");

  if (opts.verbose) {
    const systemPrompt = config.buildSystemPrompt();
    console.log(DIM("  [System Prompt Preview]"));
    console.log(DIM("  " + systemPrompt.split("\n").slice(0, 10).join("\n  ") + "..."));
    console.log("");
  }

  let currentStep = 0;
  const totalSteps = config.steps.length;
  let spinner: ReturnType<typeof ora> | null = null;

  const options: RunOptions = {
    model: opts.model,
    verbose: opts.verbose,

    onStepStart(stepId: string, stepName: string) {
      currentStep++;
      console.log("");
      console.log(YNDR_RED(`  ┌─ STEP ${currentStep}/${totalSteps}: ${stepName}`));
      console.log(YNDR_RED("  │") + DIM(`  ID: ${stepId}`));
      console.log(YNDR_RED("  │"));
      spinner = ora({ text: DIM("  Claude is working..."), indent: 3 }).start();
    },

    onStepComplete(result: StepResult) {
      if (spinner) spinner.stop();

      if (result.output) {
        printClaudeResponse(result.output);
      }

      if (result.guardrailCheck) {
        if (result.guardrailCheck.violations.length > 0) {
          console.log(YNDR_RED("  │"));
          console.log(ERR("  │  🛑 GUARDRAIL VIOLATION DETECTED"));
          for (const v of result.guardrailCheck.violations) {
            console.log(ERR(`  │     Rule: ${v}`));
          }

          if (result.status === "blocked") {
            console.log(ERR("  │  ⛔ EXECUTION HALTED — Hard stop triggered"));
            console.log(YNDR_RED("  └──────────────────────────────────────"));
            return;
          }
        }

        if (result.guardrailCheck.warnings.length > 0) {
          console.log(YNDR_RED("  │"));
          for (const w of result.guardrailCheck.warnings) {
            console.log(WARN(`  │  ⚠️  Warning: ${w}`));
          }
        }
      }

      const statusIcon = result.status === "completed" ? "✓" : result.status === "skipped" ? "⊘" : "✗";
      const statusColor = result.status === "completed" ? SUCCESS : result.status === "skipped" ? DIM : ERR;

      console.log(YNDR_RED("  │"));
      console.log(statusColor(`  │  ${statusIcon} Step ${result.status}`));

      if (result.tokenUsage) {
        console.log(DIM(`  │  Tokens: ${result.tokenUsage.input} in / ${result.tokenUsage.output} out`));
      }
      if (result.duration) {
        console.log(DIM(`  │  Duration: ${(result.duration / 1000).toFixed(1)}s`));
      }

      console.log(YNDR_RED("  └──────────────────────────────────────"));
    },

    onGuardrailViolation(stepId: string, violations: string[]) {
      console.log("");
      console.log(ERR("  🛑 GUARDRAIL VIOLATION in step: " + stepId));
      for (const v of violations) {
        console.log(ERR(`     → ${v}`));
      }
    },

    async userInputHandler(question: string): Promise<string> {
      if (spinner) spinner.stop();

      console.log(YNDR_RED("  │"));
      console.log(YNDR_BLUE(`  │  📝 ${question}`));

      const { answer } = await inquirer.prompt([
        {
          type: "input",
          name: "answer",
          message: YNDR_RED("  │  → "),
          validate: (input: string) => input.trim().length > 0 || "Please provide an answer",
        },
      ]);

      return answer;
    },
  };

  const engine = new RunEngine(config, options);
  const result = await engine.run();

  // Final summary
  console.log("");
  console.log(chalk.white("  ═════════════════════════════════════════"));
  console.log(YNDR_RED.bold("  HARNESS RUN COMPLETE"));
  console.log(chalk.white("  ═════════════════════════════════════════"));

  const completed = Object.values(result.stepResults).filter((s: StepResult) => s.status === "completed").length;
  console.log(DIM(`  Steps completed: ${completed}/${totalSteps}`));

  console.log(
    result.guardrailSummary.totalViolations > 0
      ? ERR(`  Guardrail violations: ${result.guardrailSummary.totalViolations}`)
      : SUCCESS("  Guardrail violations: 0"),
  );
  console.log(
    result.guardrailSummary.totalWarnings > 0
      ? WARN(`  Warnings: ${result.guardrailSummary.totalWarnings}`)
      : DIM("  Warnings: 0"),
  );
  console.log(DIM(`  Tokens: ${result.totalTokens.input} in / ${result.totalTokens.output} out`));
  console.log(DIM(`  Status: ${result.status}`));
  console.log("");
}

// ── build ──

async function buildCommand() {
  showBanner();
  console.log(YNDR_BLUE("  🔨 HARNESS BUILDER — Create a new harness interactively\n"));

  const client = new Anthropic();
  const conversation: Array<{ role: "user" | "assistant"; content: string }> = [];
  const systemPrompt = `You are the YNDR Trail Guide, an expert business process analyst. Your job is to interview the user about a business process they want to automate, and then generate a complete YAML harness configuration.

Ask ONE question at a time. Be conversational and friendly. Use plain English. Mirror the user's language.

Your interview should cover:
1. What process they want to automate (the big picture)
2. The step-by-step workflow (walk me through it)
3. What tools/systems they use
4. What decisions get made along the way
5. What rules must ALWAYS or NEVER happen
6. What the finished output looks like

After gathering all info, generate a complete YAML harness config with all six components:
identity, tools, steps, guardrails, output, context.

When you have enough information and are ready to generate the config, include the YAML inside a code block marked with \`\`\`yaml.`;

  // Initial greeting
  const spinner = ora({ text: DIM("  Starting Trail Guide..."), indent: 2 }).start();
  conversation.push({
    role: "user",
    content: "I want to build a new harness. Start the interview.",
  });

  const greeting = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: conversation,
  });

  const greetingText = greeting.content.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("\n");
  conversation.push({ role: "assistant", content: greetingText });
  spinner.stop();

  console.log(YNDR_BLUE("  Trail Guide: ") + chalk.white(greetingText));
  console.log("");

  // Conversation loop
  let yamlGenerated = false;
  while (!yamlGenerated) {
    const { userInput } = await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: YNDR_RED("  You → "),
        validate: (input: string) => input.trim().length > 0 || "Please type something",
      },
    ]);

    if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
      console.log(DIM("\n  Exiting builder.\n"));
      break;
    }

    conversation.push({ role: "user", content: userInput });

    const buildSpinner = ora({ text: DIM("  Thinking..."), indent: 2 }).start();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversation,
    });

    const responseText = response.content.map((c: { type: string; text?: string }) => (c.type === "text" ? c.text ?? "" : "")).join("\n");
    conversation.push({ role: "assistant", content: responseText });
    buildSpinner.stop();

    console.log("");
    console.log(YNDR_BLUE("  Trail Guide: ") + chalk.white(responseText.split("\n")[0]));
    for (const line of responseText.split("\n").slice(1)) {
      console.log("              " + chalk.white(line));
    }
    console.log("");

    // Check if YAML was generated
    if (responseText.includes("```yaml")) {
      const yamlMatch = responseText.match(/```yaml\n([\s\S]*?)```/);
      if (yamlMatch) {
        const yamlContent = yamlMatch[1];

        const { savePath } = await inquirer.prompt([
          {
            type: "input",
            name: "savePath",
            message: YNDR_RED("  Save harness config to → "),
            default: "my-harness.yaml",
          },
        ]);

        const fullPath = path.resolve(savePath);
        fs.writeFileSync(fullPath, yamlContent);
        console.log(SUCCESS(`\n  ✓ Harness saved to: ${fullPath}`));
        console.log(DIM(`  Run it with: yndr run --config ${savePath}\n`));
        yamlGenerated = true;
      }
    }
  }
}

// ── list ──

function listCommand(opts: { dir?: string }) {
  showBanner();
  console.log(YNDR_BLUE("  📋 AVAILABLE HARNESSES\n"));

  const searchDir = opts.dir ? path.resolve(opts.dir) : process.cwd();

  let files: string[];
  try {
    files = fs.readdirSync(searchDir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch {
    console.log(ERR(`  Cannot read directory: ${searchDir}\n`));
    return;
  }

  if (files.length === 0) {
    console.log(DIM("  No harness configs found in: " + searchDir));
    console.log(DIM("  Create one with: yndr build\n"));
    return;
  }

  for (const file of files) {
    try {
      const yamlSource = fs.readFileSync(path.join(searchDir, file), "utf8");
      const config = HarnessConfig.fromYaml(yamlSource);

      console.log(YNDR_RED("  ▸ ") + chalk.white.bold(config.name) + DIM(` (${file})`));
      if (config.description) console.log(DIM(`    ${config.description}`));
      console.log(
        DIM(
          `    Steps: ${config.steps.length} | Guardrails: ${config.guardrails.hard_stops.length + config.guardrails.soft_warnings.length}`,
        ),
      );
      console.log("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(WARN(`  ⚠ ${file}: ${msg}`));
    }
  }
}

// ══════════════════════════════════════════════════════════════
// CLI PROGRAM
// ══════════════════════════════════════════════════════════════

const program = new Command();

program
  .name("yndr")
  .description("YNDR Harness Orchestrator — run AI playbooks with guardrails")
  .version("2.0.0");

program
  .command("run")
  .description("Run a harness from a YAML config")
  .requiredOption("--config <file>", "Path to harness YAML config file")
  .option("--verbose", "Show system prompt and debug info")
  .option("--model <model>", "Override the Claude model")
  .action(async (opts) => {
    await runCommand(opts.config, { verbose: opts.verbose, model: opts.model });
  });

program
  .command("build")
  .description("Interactively create a new harness config")
  .action(async () => {
    await buildCommand();
  });

program
  .command("list")
  .description("List available harness configs")
  .option("--dir <path>", "Directory to search for configs")
  .action((opts) => {
    listCommand({ dir: opts.dir });
  });

// Default action: show banner + help
program.action(() => {
  showBanner();
  console.log(chalk.white("  Commands:"));
  console.log(YNDR_RED("    run") + DIM("    --config <file>  Run a harness from a YAML config"));
  console.log(YNDR_RED("    build") + DIM("                    Interactively create a new harness"));
  console.log(YNDR_RED("    list") + DIM("   [--dir <path>]   List available harness configs"));
  console.log("");
  console.log(chalk.white("  Options:"));
  console.log(DIM("    --verbose        Show system prompt and debug info"));
  console.log(DIM("    --model <name>   Override the Claude model"));
  console.log("");
  console.log(chalk.white("  Examples:"));
  console.log(DIM("    yndr run --config my-harness.yaml"));
  console.log(DIM("    yndr build"));
  console.log(DIM("    yndr list"));
  console.log("");
});

program.parseAsync(process.argv).catch((err) => {
  console.error(ERR(`\n  Fatal error: ${err.message}\n`));
  if (err.message?.includes("ANTHROPIC_API_KEY")) {
    console.log(DIM("  Set your API key: export ANTHROPIC_API_KEY=your-key-here\n"));
  }
  process.exit(1);
});
