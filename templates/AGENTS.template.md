# pi-compound — map & loop (native context, inherited by children)

Copy this file to your project root as `AGENTS.md` and edit the constitution section for your repo.

## The loop
- `/workflow-issue <text>` — direct path: spec → plan → (approve) → implement → review → (approve) → commit.
- `/workflow-feature <text>` — full path: brainstorm → (approve spec) → plan → (approve) → implement → review → (approve) → commit.
- Orchestration is **parent-driven** (the workflow prompt is guidance, not a runtime engine).
- Models per role: set in `pi-subagents` `agentOverrides` (worker = mid, reviewer = strong). Never
  set an `extensions:` field on an agent — it disables extension discovery and drops pi-compound's guardrails in that child.

## Artifacts (under `.pi/work/<slug>/`)
`spec.md` (Intent · Context · Out of Scope · Acceptance) · **`acceptance.sh`** (the executable target — exits 0 iff done) · `plan/` (`tracker.md` + one `task-NN.md` per task) · `reviews/` · `gate3.md`. The `pi-compound` extension blocks edits to `.env`, lockfiles, `constitution.md`, and post-freeze: `spec.md` + `acceptance.sh`.

**Banned patterns in `acceptance.sh`:** bare `exit 1` stubs; `grep` for file existence alone; tests that pass on the unmodified codebase; tests that pass for any non-empty output. The script must discriminate — correct implementation exits 0, everything else exits non-zero.

## The verifier has teeth (don't trust model "PASS")
Acceptance pass/fail is **deterministic**: `check_acceptance` runs `acceptance.sh` and the real exit code is the verdict — no agent may declare acceptance met over a `check_acceptance` FAIL. A model reviewer adds judgment but cannot override the deterministic result.

## Branch isolation
Every work item runs on `pi-compound/<slug>` — **never pushes** (extension blocks `git push`), never touches `main`. Dirty working tree at start → stop and ask.

## Human gates
Approve the **target** (`acceptance.sh` + spec on the feature path) before implementation · plan approval · final review + merge/push. Between approvals, implementation runs **autonomously** — disagreements are logged for the final review.

---

# constitution.md (project rules — edit per project)

> Hard, non-negotiable rules. The reviewer treats violations as blockers; the extension blocks
> edits to this file. Replace these with your project's real invariants.

1. Prefer the simplest thing that solves the problem; delete before you add.
2. Surgical, scoped changes — stay within the task's declared files unless you justify expanding.
3. No silent failures: handle or surface errors; never swallow them.
4. Match existing patterns in the codebase over introducing new ones.
5. Tests accompany behaviour changes.
