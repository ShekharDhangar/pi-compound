# pi-compound

A small, verifier-centered engineering workflow for [pi](https://pi.dev), built on
[`pi-subagents`](https://github.com/nicobailon/pi-subagents).

> **Set an executable target, then an unattended verify-fix loop runs against it** — on a branch,
> fenced by a guardrail hook, capped by a budget, with a deterministic verifier that can't be faked
> or weakened. The model is your stand-in's tool; the *verifier* is what lets you leave the room.

## Why

Orchestration is the commodity part of a coding harness; the **verifier sets the quality ceiling.**
So pi-compound keeps the loop thin (prompts the parent follows, like `pi-subagents`' `/review-loop`)
and puts the engineering into the thing that determines whether autonomy is safe: the acceptance check.

## What it is

- **Two commands** (prompt templates): `/workflow-issue` (direct) and `/workflow-feature` (with brainstorm).
  Each drives `planner → /review-loop → worker` autonomously, pausing only at human gates.
- **A deterministic verifier** (`check_acceptance` tool): the acceptance verdict is the *real exit
  code* of a project-defined `acceptance.sh`, not a model's opinion — so a model can't hallucinate "PASS."
- **Anti-reward-hack defenses:** you approve the target before work; the test must fail-then-pass
  (red-green); once approved it's **frozen** (the hook blocks edits to it); you can seed examples.
- **Branch isolation:** every work item runs on `pi-compound/<slug>`; the loop never touches `main`
  and the hook blocks `git push`. You review the branch diff and merge.
- **Guardrail hook:** blocks edits to sensitive paths (`.env`, lockfiles, `constitution.md`) — and,
  because `pi-subagents` children auto-load this extension, it governs every child agent too.

## Install

pi-compound is a [pi package](https://pi.dev/packages): install it once globally, or pin it per project.

### Prerequisites

```bash
pi install npm:pi-subagents      # required (spawning + /review-loop + /parallel-research)
pi install npm:pi-web-access     # optional (research fan-out: `/parallel-research`)
```

### Global (all projects)

```bash
pi install npm:@shekhardhangar/pi-compound
pi install git:github.com/ShekharDhangar/pi-compound
pi install /path/to/pi-compound  # local clone
```

Extension + prompts load automatically whenever you run `pi` in any project.

### Project-local (team pin)

```bash
cd your-project
pi install -l npm:@shekhardhangar/pi-compound
pi install -l git:github.com/ShekharDhangar/pi-compound@v0.1.0
pi install -l /path/to/pi-compound
```

Writes to `.pi/settings.json`; teammates get the same package after trusting the project.

### Try without installing

```bash
pi -e npm:@shekhardhangar/pi-compound
pi -e git:github.com/ShekharDhangar/pi-compound
```

### Per-project bootstrap (one time)

Copy the bundled template and edit the constitution for your repo:

```bash
# npm install (global):
cp ~/.pi/agent/npm/node_modules/@shekhardhangar/pi-compound/templates/AGENTS.template.md ./AGENTS.md

# npm install (project-local, -l):
cp .pi/npm/node_modules/@shekhardhangar/pi-compound/templates/AGENTS.template.md ./AGENTS.md

# git or local path install:
cp /path/to/pi-compound/templates/AGENTS.template.md ./AGENTS.md
```

## Usage

In any project with pi-compound installed and `AGENTS.md` bootstrapped:

```
/workflow-issue fix the broken README install link
/workflow-feature add user-facing settings for dark mode
```

See `templates/AGENTS.template.md` for the full loop, artifacts, gates, and verifier rules.

## Files

| File | What |
|---|---|
| `index.ts` | the extension: guardrail hook · frozen-acceptance enforcement · `set_stage` footer · `check_acceptance` |
| `prompts/` | the orchestration — `workflow-issue.md`, `workflow-feature.md`, `review-rubric.md` |
| `templates/AGENTS.template.md` | workflow map + constitution template (copy to `AGENTS.md` in each repo) |
| `SMOKE-TEST.md` | how to verify the hook, child inheritance, and a workflow run |

## Status

Milestone 1, verified end-to-end via headless runs (full workflow, child-governance, the
deterministic verifier catching a planted bug, frozen acceptance, `git push` blocked). The
compounding/meta-harness loop (`/learn`) is Milestone 2 — and it needs real run traces first.
