# Design System — YNDR Harness Platform

**Version:** 1.0
**Date:** 2026-02-18
**Approach:** Dark mode first

---

## Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-red` | `#E94560` | Primary action, CTA buttons, alerts, guardrail violations |
| `--color-blue` | `#0F3460` | Secondary action, links, interactive elements |
| `--color-dark` | `#1A1A2E` | Background (dark mode), card surfaces |
| `--color-dark-lighter` | `#16213E` | Elevated surfaces, sidebar, modal backgrounds |
| `--color-text` | `#E8E8E8` | Primary text (dark mode) |
| `--color-text-muted` | `#8B8B9E` | Secondary text, labels, timestamps |
| `--color-text-inverse` | `#1A1A2E` | Text on light backgrounds |
| `--color-success` | `#4ADE80` | Completed steps, success states |
| `--color-warning` | `#FBBF24` | Soft warnings, pending states |
| `--color-error` | `#EF4444` | Hard stop violations, failures |
| `--color-border` | `#2A2A3E` | Borders, dividers (dark mode) |

### Tailwind Config

```typescript
// tailwind.config.ts
const colors = {
  brand: {
    red: "#E94560",
    blue: "#0F3460",
    dark: "#1A1A2E",
    "dark-lighter": "#16213E",
  },
  surface: {
    primary: "#1A1A2E",
    elevated: "#16213E",
    overlay: "rgba(26, 26, 46, 0.8)",
  },
};
```

---

## Typography

**Font Family:** Inter (variable weight)

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-display` | 36px / 2.25rem | 700 (Bold) | 1.2 | Page titles, hero headings |
| `text-h1` | 28px / 1.75rem | 600 (SemiBold) | 1.3 | Section headings |
| `text-h2` | 22px / 1.375rem | 600 (SemiBold) | 1.35 | Card titles, dialog headings |
| `text-h3` | 18px / 1.125rem | 500 (Medium) | 1.4 | Subsection headings |
| `text-body` | 15px / 0.9375rem | 400 (Regular) | 1.6 | Body text, descriptions |
| `text-sm` | 13px / 0.8125rem | 400 (Regular) | 1.5 | Labels, metadata, timestamps |
| `text-xs` | 11px / 0.6875rem | 500 (Medium) | 1.4 | Badges, tags, counters |
| `text-mono` | 14px / 0.875rem | 400 (Regular) | 1.5 | Code, YAML display, logs |

**Mono Font:** JetBrains Mono (for code/YAML)

---

## Spacing Scale

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing (badge padding) |
| `space-2` | 8px | Element spacing (icon + text gap) |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Standard padding, card padding |
| `space-5` | 20px | Section spacing |
| `space-6` | 24px | Card spacing, form field gap |
| `space-8` | 32px | Section gap |
| `space-10` | 40px | Page section gap |
| `space-12` | 48px | Major section separation |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Tags, badges |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards, panels |
| `rounded-xl` | 16px | Modals, dialogs |
| `rounded-full` | 9999px | Avatars, dots |

---

## Component Inventory

### ConversationUI

The Build Mode chat interface. Renders a scrollable message list with user bubbles and AI responses.

```
┌─────────────────────────────────────┐
│  YNDR Trail Guide                   │
│  Build Your Playbook               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 What process do you want │   │
│  │    to automate? Describe it │   │
│  │    like you're explaining   │   │
│  │    to a new hire.           │   │
│  └─────────────────────────────┘   │
│                                     │
│       ┌─────────────────────────┐   │
│       │ I want to automate our │   │
│       │ client onboarding...   │ ← │
│       └─────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🤖 That's great! Let me    │   │
│  │    walk through a few more  │   │
│  │    questions...             │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  ┌───────────────────────┐  [Send] │
│  │ Type your response... │         │
│  └───────────────────────┘         │
└─────────────────────────────────────┘
```

**Props:**
- `conversationId: string | null` — existing conversation to resume
- `onPlaybookGenerated: (yaml: string) => void` — callback when playbook is ready

**States:** idle, waiting-for-input, streaming-response, generating-playbook, complete

---

### PlaybookCard

A card in the playbook library showing playbook summary.

```
┌───────────────────────────────────┐
│  Client Onboarding           ●── │ ← status dot (green=active)
│                                   │
│  Automates new client setup with  │
│  discovery, tech assessment, and  │
│  security review.                 │
│                                   │
│  ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │5 steps│ │8 rules│ │ v2      │  │ ← metadata badges
│  └──────┘ └──────┘ └──────────┘  │
│                                   │
│  Last run: 2 hours ago ✓          │
│                                   │
│  [ Run ]  [ Edit ]  [ ··· ]      │ ← action buttons
└───────────────────────────────────┘
```

**Props:**
- `playbook: Playbook` — playbook data
- `onRun: () => void` — trigger run
- `onEdit: () => void` — open editor

---

### RunTimeline

Live execution progress showing each step as a timeline node.

```
┌─────────────────────────────────────────┐
│  Run: Client Onboarding                 │
│  Status: Running ●                      │
│  Started: 2 min ago                     │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Client Discovery          3.2s       │
│  │  Sonnet · 1,650 tokens              │
│  │  Output: "Client: Acme Corp..."     │
│  │                                      │
│  ✓ Technical Assessment      5.1s       │
│  │  Sonnet · 2,100 tokens              │
│  │  Output: "Recommended stack..."     │
│  │                                      │
│  ● Project Structure Design  running... │
│  │  Sonnet                              │
│  │  ░░░░░░░░░░ ← progress pulse       │
│  │                                      │
│  ○ Security Review           pending    │
│  │  Haiku (validation)                  │
│  │                                      │
│  ○ Generate Deliverables     pending    │
│     Sonnet                              │
│                                         │
├─────────────────────────────────────────┤
│  Tokens: 3,750 in / 1,200 out          │
│  Guardrails: 0 violations, 1 warning   │
└─────────────────────────────────────────┘
```

**Props:**
- `runId: string` — subscribes to real-time updates
- `steps: RunStep[]` — initial step data

**States per step:** pending (○), running (● pulse), completed (✓), failed (✗), blocked (⊘)

---

### StepDiagram

Visual DAG showing step dependencies.

```
  ┌───────────┐
  │ Discovery │
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │ Tech      │
  │ Assessment│
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │ Project   │
  │ Structure │
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │ Security  │
  │ Review    │
  └─────┬─────┘
        │
        ▼
  ┌───────────┐
  │ Deliver-  │
  │ ables     │
  └───────────┘
```

**Props:**
- `steps: Step[]` — step definitions with `depends_on`

---

### GuardrailBadge

Displays guardrail status for a step or run.

```
Variants:
  ┌───────────────┐
  │ ✓ All clear   │  ← no violations or warnings (green)
  └───────────────┘

  ┌───────────────┐
  │ ⚠ 2 warnings  │  ← soft warnings flagged (yellow)
  └───────────────┘

  ┌───────────────┐
  │ ✗ BLOCKED     │  ← hard stop violation (red, pulsing)
  └───────────────┘
```

**Props:**
- `guardrailCheck: GuardrailCheckResult`
- `size: "sm" | "md"` — compact or detailed view

---

### StatusIndicator

A dot + label showing status of any entity (playbook, run, step).

```
●  Active       (green)
●  Running      (blue, pulse animation)
●  Pending      (gray)
●  Draft        (yellow)
●  Completed    (green)
●  Failed       (red)
●  Blocked      (red, solid)
●  Archived     (gray, dimmed)
```

**Props:**
- `status: string` — maps to color
- `pulse: boolean` — animate for active states
- `size: "sm" | "md" | "lg"`

---

## Dark Mode First

All components are designed for dark backgrounds by default.

**Surface hierarchy (dark mode):**
1. Page background: `#1A1A2E`
2. Card/panel surface: `#16213E`
3. Elevated surface (modals, dropdowns): `#1E2A4A`
4. Active/hover: `rgba(233, 69, 96, 0.1)` (red tint)

**Light mode (future):** Invert the hierarchy. Use CSS custom properties for all color values to enable theme switching.

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle lift (badges) |
| `shadow-md` | `0 4px 8px rgba(0,0,0,0.4)` | Cards, panels |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals, dropdowns |
| `shadow-glow` | `0 0 20px rgba(233,69,96,0.3)` | CTA buttons, active states |

---

## Animation

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `transition-fast` | 150ms | ease-out | Hover states, toggles |
| `transition-normal` | 250ms | ease-in-out | Panel open/close |
| `transition-slow` | 400ms | ease-in-out | Page transitions |
| `pulse` | 2s | infinite | Running step indicator |
| `slide-up` | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Toast/notification entry |
