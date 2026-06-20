---
description: pi-compound — review rubric (used by reviewers in /review-loop)
---

Review the current change as a **fresh-context** reviewer: inspect the repo, `constitution.md`,
the task/plan, and the current diff **directly from files** — do not rely on the conversation.
Do not edit files; report findings.

**The verifier sets the reliability ceiling.** A loose review just lets the autonomous loop "automate being wrong, faster." Be the slit: prefer **executable** evidence over opinion — if an Acceptance item can be a command/test, *run it* and judge on the result, not on reading the diff.

Check, in priority order:
1. **Acceptance (output reward) — deterministic, not your opinion.** The authoritative pass/fail comes from the **`check_acceptance`** tool (which runs `.pi/work/<slug>/acceptance.sh`). **Report its verdict + real output; never assert "PASS" yourself.** Then *sanity-check the script itself*: does `acceptance.sh` genuinely test the stated intent, or is it trivially passing / missing cases? Flag a weak acceptance script as a blocker — a loose check is the real risk.
2. **Correctness / regressions** — edge cases, error handling, no silent failures.
3. **Constitution** — any violation of a hard rule in `constitution.md`? (blocker)
4. **Simplicity / maintainability** — is there a simpler, clearer way? Unnecessary abstraction, dead code, over-engineering.
5. **Tests** — adequate unit/behaviour coverage for the change?

(Interim reviews are a **trajectory** signal — catch *drift from the spec's intent* early. The final review is the **output** signal — does the result meet Acceptance. Most work needs both.)

Synthesise into: **blockers** · **fixes worth doing now** · **optional** · **defer/ignore (with a one-line reason)**.
Do not pad with speculative polish. If you surface an unapproved product/scope/architecture
decision, flag it for the human rather than assuming.

For each finding the parent may **fix it** or **rebut with a one-line justification** — both are
logged. Stop the loop when reviewers find no blockers or fixes worth doing now, or at the round cap (3).
