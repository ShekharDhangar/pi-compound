---
description: pi-compound — review rubric (used by reviewers in /review-loop)
---

Review the current change as a **fresh-context** reviewer. Read `constitution.md`, the task/plan, and the diff directly from files.

Prefer **executable** evidence — if an Acceptance item can be a command/test, *run it*.

Check, in priority order:
1. **Acceptance — deterministic, not your opinion.** Call `check_acceptance` and report its verdict + real output. Then sanity-check the script: does `acceptance.sh` genuinely test the stated intent, or is it trivially passing / missing cases? A weak acceptance script is a blocker.
2. **Correctness / regressions** — edge cases, error handling, no silent failures.
3. **Constitution** — any violation of a hard rule in `constitution.md`? (blocker)
4. **Simplicity / maintainability** — unnecessary abstraction, dead code, over-engineering.
5. **Tests** — adequate unit/behaviour coverage for the change?

(Interim reviews catch *drift from spec intent*. Final review checks *does the result meet Acceptance*.)

Synthesise into: **blockers** · **fixes worth doing now** · **optional** · **defer/ignore (one-line reason)**. Flag unapproved product/scope/architecture decisions for the human.
