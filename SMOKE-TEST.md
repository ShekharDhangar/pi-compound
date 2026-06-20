# pi-compound (milestone 1) — smoke test

Confirms the only two things that must be code: the **guardrail hook** (incl. spike #1 — children
inherit it) and the **`set_stage`** footer tool. Orchestration itself is the prompt templates.

## Setup
```bash
mkdir -p ~/tmp/pc-test/.pi/extensions ~/tmp/pc-test/.pi/prompts && cd ~/tmp/pc-test
cp ~/code/pi-compound/index.ts            .pi/extensions/pi-compound.ts
cp ~/code/pi-compound/prompts/*.md        .pi/prompts/
cp ~/code/pi-compound/AGENTS.md           .          # contains the constitution
git init -q
: > ~/.pi/pi-compound-hook.log
pi                                                    # accept project trust so .pi/ loads
```

## Test 1 — hook blocks sensitive paths, allows normal ones (parent)
```
Use the write tool to write "x" to ./.env
Use the write tool to write "x" to ./package-lock.json
Use the write tool to write "x" to ./src/foo.ts
```
Expect: `.env` and `package-lock.json` **blocked**; `src/foo.ts` **allowed**.
`cat ~/.pi/pi-compound-hook.log` → shows the three attempts with blocked true/true/false.

## Test 2 — SPIKE #1: hook also fires in a CHILD process
```
Use the worker subagent to write "x" to ./.env , then report what happened.
```
Expect: the worker child is **blocked by our hook**, and a new log line appears **with a different
`pid`** — proof the child auto-loaded `pi-compound`. (Source said it would; this is the eyes-on.)
`cat ~/.pi/pi-compound-hook.log` → look for 2+ distinct pids.

## Test 3 — set_stage drives the footer
```
Call the set_stage tool with flow "issue" and stage "Plan".
```
Expect the footer shows `pi-compound ⋮ Spec → ▶Plan → Implement`.

## Test 4 — the workflow prompt runs end-to-end (smoke, small issue)
```
/workflow-issue the README has a broken link to the install docs
```
Expect: it writes `.pi/work/<slug>/spec.md` (Intent·Context·Acceptance), delegates to `planner`,
**pauses for plan approval**, and the footer tracks stages. You don't have to finish it — you're
confirming the prompt orchestrates pi-subagents and pauses at the gate.

| Result | Meaning |
|---|---|
| Test 2 shows a child pid, write blocked | ✅ spike #1 — children inherit the guardrail |
| Test 1 blocks .env/lockfile, allows src | ✅ protected scoping correct (sensitive-only in M1) |
| Test 4 pauses at plan approval | ✅ prompt-driven orchestration + gates work |
