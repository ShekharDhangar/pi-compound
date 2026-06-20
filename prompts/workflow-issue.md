---
description: pi-compound — direct issue path (spec → plan → implement → review), you review at the end
---

You are orchestrating the pi-compound **issue** workflow for: `$ARGUMENTS`

You are the parent/controller. Use the `subagent` tool to delegate; keep decision-making yourself.
Call `set_stage` (flow: "issue") at each transition so the footer tracks progress.

First-principles, simplicity-biased throughout. Follow `AGENTS.md` and `constitution.md`.

## 0. Isolate (branch — so the unattended loop can't touch my live tree)
- If the working tree has **uncommitted changes, stop and ask me** — don't clobber my WIP.
- Create/switch to a dedicated branch: `git switch -c pi-compound/<slug>` (reuse it if resuming).
- All work happens on this branch. **Never commit on `main`/`master`. Never `git push`** (the
  extension blocks it) — at gate 3 I review the branch diff and merge/push myself.

## 1. Spec  → `set_stage("issue", "Spec")`
Write `.pi/work/<slug>/spec.md` with three visible sections:
- **Intent** — what the issue is, constraints, failure modes (the issue text is the intent).
- **Context** — the relevant code/stack (use `scout` if you need to understand the codebase first).
- **Acceptance** — the done-condition. Write the prose version in `spec.md`, **and** write the
  machine-checkable version as **`.pi/work/<slug>/acceptance.sh`**: a bash script that **exits 0 iff
  the work meets the done-condition** (include any fixtures it needs, e.g. an `expected.txt` to diff
  against). This script is the real target — the deterministic verifier runs it, so a model can't
  fake a pass. Make it genuinely test the intent (not a trivially-passing stub). If you can't form a
  checkable condition confidently, **ask me one question** or suggest `/workflow-feature`. Never vacuous.
- **Red-green check (the test must discriminate).** Immediately run `check_acceptance` on the
  *unchanged* codebase — it **must FAIL** now (the change isn't made yet). If a brand-new acceptance
  **passes** before any work, it tests nothing real → fix it or **ask me**. A test that never fails is
  worse than no test.

## 2. Plan  → `set_stage("issue", "Plan")`
Delegate to the `planner` subagent (read-only): produce `.pi/work/<slug>/plan/` as **multiple
`task-NN.md` files + a `tracker.md`** — never one giant file, even for a single task. Each task
states its file scope and a short functional description.

**→ Approve the TARGET before I leave (the one gate that matters).** Pause and show me **both the
plan and `acceptance.sh`** for approval. The acceptance is what the unattended loop is graded
against — your OK on it is what makes leaving the room safe. (A model wrote it; you own it.) Nothing
runs until you approve. **On my approval, write an empty `.pi/work/<slug>/.frozen` file** — that
activates the freeze, and the extension then mechanically blocks any agent edit to `acceptance.sh`.

## 3. Implement — the unattended verify-fix loop  → `set_stage("issue", "Implement · task N/total")`
After I approve, run autonomously **without me present**. The **verifier is my stand-in** — it,
not me, decides whether to continue. Don't stop for me until a stop condition below.

**`acceptance.sh` is FROZEN here.** `worker` makes the *code* pass the approved test — it may **not**
edit `acceptance.sh` or its fixtures. If a worker believes the acceptance is wrong, that's a
**hard blocker → stop and ask me**, never a silent change.

The loop, per task in order:
- `worker` implements the next task (code + its own unit/behaviour tests). A new task discovered
  mid-flight (scope expansion or an unfixed finding) gets its own `task-NN.md` first (→ `tracker.md`).
- **Verify** = two parts, run after every 5 completed tasks (trajectory) and once at the end (output); ≤5 tasks → end only:
  - **(a) Acceptance — deterministic, authoritative.** Call the **`check_acceptance`** tool (`slug` = the work-item slug). Its **PASS/FAIL is the verdict** — never treat acceptance as met if it returns FAIL. A FAIL → feed its **real output** back to `worker` to fix, then re-run `check_acceptance`.
  - **(b) Judgment.** A fresh-context `reviewer` via `/review-loop` against `review-rubric.md` for constitution, correctness, simplicity, and a sanity-check that `acceptance.sh` genuinely tests the intent. Judgment adds findings; it cannot turn a `check_acceptance` FAIL into a pass.
- Verify **fails** → feed findings back → `worker` fixes → re-verify. Verify **passes** → continue. Update `set_stage`.

**Stop conditions — on ANY, stop and surface to me (write `gate3.md`); do not push through:**
1. **Done** — all Acceptance met and the final verify passes.
2. **Budget cap** — more than **3 fix-rounds on one task**, or a total run cap I set, is hit → stop rather than burn tokens unattended.
3. **Hard blocker** — a constitution violation it can't resolve, or an unapproved product/scope/architecture decision.

If you think a reviewer is wrong, note it and continue — surface the disagreement at the end, don't halt on it.

## 4. Done → pause for my review
Write `.pi/work/<slug>/gate3.md` (result summary · open findings · reviewer disagreements · scope
expansions · acceptance result). End it with an **`## Outcomes`** block (this is the trace a future
self-improvement pass learns from — keep it honest): `acceptance: PASS/FAIL` · `fix-rounds: N` ·
`human-escalations: N` · `reviewer-findings: N` · `notes: what was awkward / where the harness fought you`.
Commit the work **on the branch** `pi-compound/<slug>`. **Show me `gate3.md` plus the branch diff
(`git diff main...HEAD`), then stop.** Do **not** merge to `main` and do **not** push — I review and do that.
