# Agent Behavior & Orchestration — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18

---

## Model Routing Table

The engine automatically selects the appropriate Claude model based on step characteristics. Explicit overrides are available via the `model` field on any step.

### Routing Logic (from `agents/model-router.ts`)

```
Step received
    │
    ├── step.model defined? ──→ Use specified model
    │
    ├── step.type === "validation" ──→ Haiku
    │
    ├── step.type === "interactive" ──→ Sonnet
    │
    └── step.type === "autonomous"
            │
            ├── actions.length > 5 ──→ Sonnet
            ├── actions.length <= 2 && no prompt ──→ Haiku
            └── default ──→ Sonnet
```

### Model Specifications

| Tier | Model ID | Use Cases | Cost (per 1M tokens) | Max Context |
|------|----------|-----------|----------------------|-------------|
| **Opus** | `claude-opus-4-20250514` | Complex planning, architecture decisions, multi-step reasoning, code review | Input: $15.00 / Output: $75.00 | 200K |
| **Sonnet** | `claude-sonnet-4-20250514` | Feature implementation, standard execution, interactive conversations, code generation | Input: $3.00 / Output: $15.00 | 200K |
| **Haiku** | `claude-haiku-4-5-20251001` | Validation checks, classification, simple formatting, guardrail enforcement | Input: $0.80 / Output: $4.00 | 200K |

### When to Use Each Tier

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| SOP discovery interview | Sonnet | Needs empathy and follow-up, not deep reasoning |
| Generate playbook YAML | Sonnet | Structured output generation |
| Validate generated YAML | Haiku | Simple pass/fail check |
| Execute autonomous step (complex) | Sonnet | Multi-action execution |
| Execute autonomous step (simple) | Haiku | Quick classification or formatting |
| Guardrail classification | Haiku | Binary yes/no violation check |
| Architecture decisions | Opus | Deep reasoning, trade-off analysis |
| Code review | Opus | Pattern detection, best practices |
| Sprint planning | Opus | Complex prioritization |

---

## Swarm Team Configurations

For development tasks, agents work in teams. Each team config defines roles, model assignments, and coordination patterns.

### Discovery Team (Section 1)

```yaml
team: discovery
agents:
  - name: product-strategist
    model: opus
    role: "Write PRD, define personas, prioritize features"
    tools: [Read, Write, WebSearch, WebFetch]

  - name: market-researcher
    model: sonnet
    role: "Competitive analysis, TAM estimation, gap identification"
    tools: [WebSearch, WebFetch, Read, Write]

  - name: docs-writer
    model: sonnet
    role: "Generate CLAUDE.md, SOP.md, and all documentation"
    tools: [Read, Write, Glob, Grep]
```

### Architecture Team (Section 2)

```yaml
team: architecture
agents:
  - name: system-architect
    model: opus
    role: "Design system architecture, data flow, technology decisions"
    tools: [Read, Write, WebSearch]

  - name: db-designer
    model: sonnet
    role: "Schema design, RLS policies, migration scripts"
    tools: [Read, Write, Bash]

  - name: api-designer
    model: sonnet
    role: "Endpoint specification, request/response schemas"
    tools: [Read, Write]

  - name: ui-designer
    model: sonnet
    role: "Component inventory, design tokens, layout patterns"
    tools: [Read, Write]
```

### Development Team (Section 3)

```yaml
team: development
agents:
  - name: lead-engineer
    model: opus
    role: "Code review, architecture compliance, PR reviews"
    tools: [Read, Grep, Glob]

  - name: backend-engineer
    model: sonnet
    role: "API routes, engine integration, database queries"
    tools: [Read, Write, Edit, Bash, Grep, Glob]

  - name: frontend-engineer
    model: sonnet
    role: "React components, layouts, client-side state"
    tools: [Read, Write, Edit, Bash, Grep, Glob]

  - name: test-engineer
    model: haiku
    role: "Unit tests, integration tests, E2E test scripts"
    tools: [Read, Write, Edit, Bash]
```

### QA Team (Section 4)

```yaml
team: qa
agents:
  - name: qa-lead
    model: sonnet
    role: "Full functional testing, cross-browser, security audit"
    tools: [Read, Write, Bash, WebFetch]

  - name: accessibility-auditor
    model: haiku
    role: "WCAG 2.1 AA compliance checks"
    tools: [Read, Bash]

  - name: performance-tester
    model: haiku
    role: "Lighthouse audits, bundle analysis"
    tools: [Read, Bash]
```

---

## Guardrail Enforcement Hooks

### Pre-Execution Hooks

Before a step executes, the engine runs these checks:

1. **Dependency check:** Verify all `depends_on` steps have completed
2. **Token budget check:** Ensure remaining budget allows execution
3. **Rate limit check:** Respect Claude API rate limits
4. **Blocked tool check:** Verify step doesn't request blocked tools

### Post-Execution Hooks

After a step produces output:

1. **GuardrailEngine.checkResponse():** Scan for hard stop violations
2. **Token accounting:** Update total tokens consumed
3. **Output validation:** If step has `output` key, verify it's non-empty
4. **Event emission:** Notify subscribers via EventBus

### Guardrail Processing Flow

```
Step output text
       │
       ▼
┌──────────────────────┐
│ Hard Stop Check      │
│                      │
│ • API key patterns   │──→ BLOCKED: halt execution
│ • Destructive SQL    │
│ • PII/PHI patterns   │
│ • Custom hard stops  │
└──────────┬───────────┘
           │ (no violations)
           ▼
┌──────────────────────┐
│ Soft Warning Check   │
│                      │
│ • Cost thresholds    │──→ WARNING: flag + continue
│ • Complexity alerts  │
│ • Security flags     │
│ • Custom warnings    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Compliance Check     │
│                      │
│ • Format validity    │──→ LOG: record for audit
│ • Required fields    │
│ • Naming conventions │
└──────────┬───────────┘
           │
           ▼
       Step passes
       → stored in stepOutputs
       → event emitted
```

---

## Token Budgets

### Per-Step Defaults

| Step Type | Max Input Tokens | Max Output Tokens | Max Turns |
|-----------|-----------------|-------------------|-----------|
| Interactive | 8,000 | 4,000 | 10 |
| Autonomous | 16,000 | 8,000 | 1 |
| Validation | 4,000 | 1,000 | 1 |

### Per-Run Budget

| Run Type | Total Token Budget | Rationale |
|----------|-------------------|-----------|
| Short playbook (1-3 steps) | 50,000 | Quick operations |
| Medium playbook (4-8 steps) | 200,000 | Standard workflows |
| Long playbook (9+ steps) | 500,000 | Complex processes |
| Build Mode conversation | 100,000 | Interview + generation |

**Budget enforcement:** The RunEngine tracks cumulative token usage. If the budget is exceeded, the engine:
1. Logs a warning
2. Attempts to complete the current step
3. Skips remaining steps
4. Returns a `halted` status with budget exhaustion reason

### Cost Estimation

Before a run starts, the engine estimates cost:

```
estimated_cost = Σ (step_estimated_tokens * model_cost_per_token)
```

If estimated cost exceeds a threshold ($5 default, configurable per tenant), the UI displays a confirmation dialog before starting.

---

## Prompt Construction

### System Prompt Structure

The `buildSystemPrompt()` method (in `yaml-parser.ts`) constructs the system prompt from the harness config:

```
# YOUR IDENTITY
Name: [identity.name]
Role: [identity.role]
Expertise: [identity.expertise]
Communication Style: [identity.tone]
Context: [identity.context]

# GUARDRAILS — YOU MUST FOLLOW THESE AT ALL TIMES

## HARD STOPS (Immediately halt if triggered)
- [guardrails.hard_stops[0]]
- [guardrails.hard_stops[1]]
...

## WARNINGS (Flag but continue)
- [guardrails.soft_warnings[0]]
...

## COMPLIANCE REQUIREMENTS
- [guardrails.compliance[0]]
...

# TOOLS YOU CAN USE
- [tools.allowed[0]]
...

# TOOLS YOU MUST NOT USE
- [tools.blocked[0]]
...

# OUTPUT FORMAT
Deliver your final output as: [output.format]
Include: [output.includes]

# PRELOADED CONTEXT
- [context.preloaded[0]]
...
```

### Step-Specific Prompts

Each step type has a dedicated prompt builder (from `agents/prompt-builder.ts`):

| Step Type | Prompt Strategy |
|-----------|----------------|
| **Autonomous** | System prompt + step actions + previous step outputs as context |
| **Interactive** | System prompt + step questions + conversation history |
| **Validation** | System prompt + checks to verify + content to validate |

---

## Error Recovery

### Step Failure Handling

```
Step fails (API error, timeout, unexpected response)
       │
       ├── Attempt 1: Retry with same model (after 2s delay)
       │
       ├── Attempt 2: Retry with Sonnet (if original was Haiku)
       │
       ├── Attempt 3: Log failure, mark step as "failed"
       │
       └── Continue to next step (if no downstream dependencies)
           OR halt run (if dependent steps exist)
```

### API Error Handling

| Error | Recovery |
|-------|----------|
| 429 Rate Limited | Exponential backoff (1s, 2s, 4s, 8s) |
| 500 Server Error | Retry up to 3 times |
| 401 Auth Error | Halt run, alert user to check API key |
| Network timeout | Retry once, then fail step |
| Overloaded | Wait 30s, retry |
