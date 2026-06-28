# pi-compound — project context (this repo)

Source repo for the **pi-compound** pi package: a verifier-centered engineering workflow built on
[`pi-subagents`](https://github.com/nicobailon/pi-subagents).

- **GitHub:** https://github.com/ShekharDhangar/pi-compound
- **npm:** `@shekhardhangar/pi-compound`
- **Install:** `pi install npm:@shekhardhangar/pi-compound` (or `pi install git:github.com/ShekharDhangar/pi-compound`)

## What this repo is

A small pi **extension + prompt templates**, not an application. Milestone 1 ships:

| Path | Role |
|---|---|
| `index.ts` | Guardrail hook · frozen-acceptance enforcement · `set_stage` footer · `check_acceptance` |
| `prompts/` | `/workflow-issue`, `/workflow-feature`, `review-rubric` orchestration |
| `templates/AGENTS.template.md` | Consumer template — copy into target projects as `AGENTS.md` |
| `SMOKE-TEST.md` | Manual verification checklist |
| `README.md` | Install and usage docs |

Orchestration is **prompt-driven** (parent follows workflow prompts). Code only does what prompts cannot: enforce guardrails and run the deterministic verifier.

## Working in this repo

- **Do not** use `/workflow-issue` or `/workflow-feature` here unless explicitly testing the smoke path — this repo is the harness source, not a consumer project.
- Prefer surgical edits: extension logic in `index.ts`, orchestration in `prompts/`, docs in `README.md` / `SMOKE-TEST.md`.
- Run smoke checks from `SMOKE-TEST.md` after hook or verifier changes.
- Test local install: `pi install ./` or `pi install -l ./` from this directory.
- Unscoped npm name `pi-compound` is taken by another package; publish only as `@shekhardhangar/pi-compound`.
- **Commits carry no agent attribution** — no `Co-authored-by:` trailers or “Generated with …” lines.

## The loop (for consumer projects)

Downstream projects install the package globally or per-project, copy `templates/AGENTS.template.md` → `AGENTS.md`, then run:

- `/workflow-issue <text>` — spec → plan → (approve) → implement → review → (approve) → commit
- `/workflow-feature <text>` — brainstorm → (approve spec) → plan → (approve) → implement → review → (approve) → commit

Artifacts live under `.pi/work/<slug>/`: `spec.md`, **`acceptance.sh`**, `plan/`, `reviews/`, `gate3.md`.

**Verifier:** `check_acceptance` runs `acceptance.sh`; exit code 0 is the only PASS. Models cannot override a FAIL.

**Branch isolation:** work on `pi-compound/<slug>`; hook blocks `git push` and edits to `main`.

**Child agents:** inherit this extension automatically via pi-subagents — never set `extensions:` on subagent configs.

---

# constitution.md (this repo)

1. Prefer the simplest thing that solves the problem; delete before you add.
2. Surgical, scoped changes — stay within the task's declared files unless you justify expanding.
3. No silent failures: handle or surface errors; never swallow them.
4. Match existing patterns in the codebase over introducing new ones.
5. Extension stays tiny: guardrails + verifier + footer only; orchestration stays in prompts.
6. Docs and install paths must stay accurate — this package is consumed globally across projects.
7. `acceptance.sh` patterns in workflow docs must remain non-gameable (no trivial pass stubs).
