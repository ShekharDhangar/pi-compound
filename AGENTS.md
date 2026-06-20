# pi-compound — map & loop (native context, inherited by children)

This file is loaded into every session (parent and `pi-subagents` children, because they set
`inheritProjectContext: true`). It carries the **map** of the workflow and the **constitution**
so every agent — planner, worker, reviewer — is governed by the same rules.

## The loop
- `/workflow-issue <text>` — direct path: spec → plan → (approve) → implement → review → (approve) → commit.
- `/workflow-feature <text>` — full path: brainstorm → (approve spec) → plan → (approve) → implement → review → (approve) → commit.
- Orchestration is **parent-driven** (the workflow prompt is guidance, not a runtime engine).
- Models per role: set in `pi-subagents` `agentOverrides` (worker = mid, reviewer = strong). Never
  set an `extensions:` field on an agent — it disables extension discovery and drops pi-compound's
  guardrails in that child.

## Artifacts (under `.pi/work/<slug>/`)
`spec.md` (Intent · Context · Acceptance) · **`acceptance.sh`** (the executable target — exits 0 iff
done) · `plan/` (`tracker.md` + one `task-NN.md` per task) · `reviews/` · `gate3.md`. Agents author
these. The `pi-compound` extension blocks edits to genuinely sensitive paths (`.env`, lockfiles, `constitution.md`).

## The verifier has teeth (don't trust model "PASS")
Acceptance pass/fail is **deterministic**: the `check_acceptance` tool runs `acceptance.sh` and the real
exit code is the verdict — no agent may declare acceptance met over a `check_acceptance` FAIL. A model
reviewer adds judgment (constitution, correctness, simplicity, *and whether `acceptance.sh` truly tests
the intent*) but cannot override the deterministic result.

## Branch isolation
Every work item runs on its own branch `pi-compound/<slug>` — the unattended loop never touches
`main` and **never pushes** (the extension blocks `git push`). The human reviews the branch diff at
gate 3 and merges/pushes. If the tree is dirty at the start, the loop stops and asks.

## Human gates
Approve the **target** (`acceptance.sh`, + spec on the feature path) before implementation · plan
approval · final review + merge/push authorisation. Between approval and the final pause,
implementation runs **autonomously** — nothing halts; disagreements are logged for the final review.

---

# constitution.md (project rules — edit per project)

> Hard, non-negotiable rules. The reviewer treats violations as blockers; the extension blocks
> edits to this file. Replace these with your project's real invariants.

1. Prefer the simplest thing that solves the problem; delete before you add.
2. Surgical, scoped changes — stay within the task's declared files unless you justify expanding.
3. No silent failures: handle or surface errors; never swallow them.
4. Match existing patterns in the codebase over introducing new ones.
5. Tests accompany behaviour changes.
