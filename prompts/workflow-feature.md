---
description: pi-compound — full feature path (brainstorm → plan → implement → review)
---

You are orchestrating the pi-compound **feature** workflow for: `$ARGUMENTS`

You are the parent/controller. Use the `subagent` tool to delegate; keep decision-making yourself.
Call `set_stage` (flow: "feature") at each transition. First-principles, simplicity-biased.
Follow `AGENTS.md` and `constitution.md`.

## 0. Isolate (branch)
If the working tree has **uncommitted changes, stop and ask me**. Otherwise create/switch to
`git switch -c pi-compound/<slug>`. All work stays on this branch; **never commit on `main`, never
`git push`** — I review the branch diff and merge/push after gate 3.

## 1. Brainstorm  → `set_stage("feature", "Brainstorm")`
Iterative and two-way — **do not settle on your first idea**.
- **Interview me** one first-principles question at a time. If the problem is too big, ask me to
  break it down and we solve one piece at a time.
- **Research fan-out** (for non-trivial problems): launch 3–4 parallel subagents via
  `/parallel-research` — `researcher` (eng blogs / docs / sources) and `scout` (our codebase) —
  each a different angle. Then synthesise **one approach custom to us**: get inspired, mix and
  match, tweak/add/remove — never copy wholesale. If a simple known solution genuinely fits, take
  it; otherwise iterate to our own. Bias hard toward the simplest thing that solves it.
- Write `.pi/work/<slug>/spec.md` (**Intent · Context · Acceptance**) **and** the machine-checkable
  **`.pi/work/<slug>/acceptance.sh`** (a bash script that **exits 0 iff the work is done**, with any
  fixtures it needs). The script is the real target — the deterministic `check_acceptance` tool runs
  it during verify, so a model can't fake a pass. It's both the quality ceiling and what lets the
  implement loop run without me.
- **Red-green check:** run `check_acceptance` on the *unchanged* code — it **must FAIL** now; if a
  brand-new acceptance passes before any work, it tests nothing → fix it or ask me.
- Go back and forth with me until **I approve the spec _and_ `acceptance.sh`** (you own the target —
  a model wrote it, I sign off on it). **On approval, write `.pi/work/<slug>/.frozen`** to lock the
  acceptance — the implementer then cannot edit it (must escalate to change it). **Pause for my approval.**

## 2. Plan  → `set_stage("feature", "Plan")`
Same as the issue workflow: `planner` → multi-file `plan/` + `tracker.md`, then **pause for my
plan approval**.

## 3. Implement  → `set_stage("feature", "Implement · task N/total")`
Same as the issue workflow: `worker` per task; new tasks get their own `task-NN.md`; interim
review every 5 completed tasks + a final review via `/review-loop`; reviewers check Acceptance;
log disagreements, don't halt.

## 4. Done → pause for my review
Write `.pi/work/<slug>/gate3.md` and **stop**. Do not commit/push until I authorise it.
