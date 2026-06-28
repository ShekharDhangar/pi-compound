// pi-compound — extension (milestone 1)
//
// Orchestration is PROMPT-DRIVEN (see prompts/*.md), per pi-subagents' own guidance:
// "use orchestration as parent-agent guidance, not as a runtime workflow mode."
// So this extension is deliberately tiny — it only does the two things a prompt CAN'T:
//   1. The Layer-2 guardrail hook (cooperative; enforcement must be code).
//   2. A `set_stage` tool so the workflow prompt can drive the live footer indicator.
//
// Install: `pi install npm:@shekhardhangar/pi-compound`, `pi install git:github.com/ShekharDhangar/pi-compound`, or `pi install ./`.
// Hook firings are logged to ~/.pi/pi-compound-hook.log (with pid → proves children inherit it).

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { spawn } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

const HOOK_LOG = `${homedir()}/.pi/pi-compound-hook.log`;

const LOCKFILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json",
  "Cargo.lock", "poetry.lock", "Gemfile.lock", "composer.lock", "go.sum",
]);

// Milestone 1 protects only genuinely-sensitive paths + the rules file. (No .pi/memory yet —
// the compounding loop is milestone 2, which is what kept the control-plane carve-out simple.)
function protectReason(absPath: string): string | null {
  const name = basename(absPath);
  if (name === ".env" || name.startsWith(".env.")) return "secrets file";
  if (LOCKFILES.has(name)) return "dependency lockfile (change deps deliberately, not via edit)";
  if (name === "constitution.md") return "the project's own rules file — agents don't rewrite it";
  return null;
}

// Anti-reward-hack: once the human approves a work item, the orchestrator writes
// .pi/work/<slug>/.frozen . After that, no agent may edit that item's acceptance.sh or its
// fixtures (expected*) — the implementer cannot move its own goalposts. Before .frozen exists, the
// spec-author writes acceptance.sh freely. Cooperative-grade (a worker would have to delete .frozen
// to bypass — egregious and visible in the diff).
function frozenAcceptanceReason(abs: string): string | null {
  const parts = abs.split("/");
  for (let i = 1; i < parts.length - 2; i++) {
    // match …/.pi/work/<slug>/<file> with <file> directly under <slug>
    if (parts[i - 1] === ".pi" && parts[i] === "work" && i + 3 === parts.length) {
      const file = parts[i + 2]!;
      const slugDir = parts.slice(0, i + 2).join("/"); // …/.pi/work/<slug>
      if (!existsSync(join(slugDir, ".frozen"))) continue;
      if (file === "spec.md") {
        return "frozen spec — scope is locked after approval; escalate to the human to change it";
      }
      if (file === "acceptance.sh" || file.startsWith("expected")) {
        return "frozen acceptance — the implementer cannot change the approved test; escalate to the human to change it";
      }
    }
  }
  return null;
}

function logHook(entry: Record<string, unknown>): void {
  try {
    appendFileSync(HOOK_LOG, JSON.stringify({ ts: new Date().toISOString(), pid: process.pid, ...entry }) + "\n");
  } catch { /* logging must never break the agent */ }
}

// Run a script deterministically and return its real exit code + (tail of) output.
// This is the whole point of check_acceptance: the VERDICT comes from actually running the
// check, so a model can't hallucinate "PASS" over a failing diff.
function runScript(script: string, cwd: string, timeoutMs = 120_000): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve) => {
    let out = "";
    const child = spawn("bash", [script], { cwd });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, out: out.slice(-4000) }); });
    child.on("error", (e) => { clearTimeout(timer); resolve({ code: -1, out: String(e) }); });
  });
}

export default function (pi: ExtensionAPI) {
  // ---- Layer-2 guardrail hook (cooperative; §3.2) -----------------------------------------
  pi.on("tool_call", async (event, ctx) => {
    // Branch isolation: the unattended loop must never push (the one outward, irreversible action).
    // It works on a branch; the human reviews and pushes after gate 3.
    if (isToolCallEventType("bash", event)) {
      const cmd = event.input.command ?? "";
      if (/\bgit\s+push\b/.test(cmd)) {
        logHook({ cwd: ctx.cwd, tool: "bash", path: cmd, blocked: true });
        return { block: true, reason: "pi-compound: `git push` is human-authorized — the loop works on a branch; review and push after gate 3." };
      }
      return;
    }

    let target: string | undefined;
    if (isToolCallEventType("write", event)) target = event.input.path;
    else if (isToolCallEventType("edit", event)) target = event.input.path;
    if (target === undefined) return;

    const abs = isAbsolute(target) ? target : resolve(ctx.cwd, target);

    // Enforce red-green before freeze: .frozen must not be created until check_acceptance
    // has confirmed a FAIL on the unchanged code (sentinel written by check_acceptance itself).
    if (basename(abs) === ".frozen") {
      const redGreenPath = join(dirname(abs), ".red-green-passed");
      if (!existsSync(redGreenPath)) {
        logHook({ cwd: ctx.cwd, tool: event.toolName, path: abs, blocked: true, reason: "no-red-green" });
        return { block: true, reason: `pi-compound: ${abs} — cannot freeze before red-green check. Run check_acceptance on unchanged code first and confirm it returns FAIL.` };
      }
    }

    const reason = protectReason(abs) ?? frozenAcceptanceReason(abs);
    logHook({ cwd: ctx.cwd, tool: event.toolName, path: abs, blocked: reason !== null });
    if (reason) return { block: true, reason: `pi-compound: ${abs} — ${reason}.` };
  });

  // ---- set_stage tool: prompt-driven footer indicator (§9.1) ------------------------------
  pi.registerTool({
    name: "set_stage",
    label: "Set workflow stage",
    description:
      "Update the pi-compound footer to show the current workflow stage. Call set_stage at each " +
      "stage transition. flow: 'feature' (Brainstorm→Plan→Implement) or 'issue' (Spec→Plan→Implement). " +
      "stage: the current stage name, optionally with sub-progress, e.g. 'Implement · task 6/16'.",
    parameters: Type.Object({
      flow: Type.String({ description: "'feature' or 'issue'" }),
      stage: Type.String({ description: "current stage, e.g. 'Plan' or 'Implement · task 6/16'" }),
    }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const base = params.flow === "feature" ? ["Brainstorm", "Plan", "Implement"] : ["Spec", "Plan", "Implement"];
      const head = params.stage.split("·")[0]!.trim();
      const line = base.map((s) => (s === head ? `▶${params.stage}` : s)).join(" → ");
      ctx.ui.setStatus("pi-compound", `pi-compound ⋮ ${line}`);
      return { content: [{ type: "text", text: `stage set: ${line}` }], details: {} };
    },
  });

  // ---- check_acceptance: the verifier WITH TEETH (deterministic, native) ------------------
  // Runs .pi/work/<slug>/acceptance.sh and returns an AUTHORITATIVE pass/fail from the real exit
  // code. The model reviewer adds judgment on top but CANNOT override this verdict. This is the
  // fix for the run where a model hallucinated "Acceptance: PASS" over a file that failed.
  pi.registerTool({
    name: "check_acceptance",
    label: "Check acceptance (deterministic)",
    description:
      "Run the work item's executable acceptance check (.pi/work/<slug>/acceptance.sh) and return a " +
      "DETERMINISTIC pass/fail from the real exit code + output. This verdict is AUTHORITATIVE — do not " +
      "override it with judgment. Call it during every verify. If acceptance.sh is missing it says so, " +
      "and you must fall back to manual judgment and flag LOW CONFIDENCE at the gate.",
    parameters: Type.Object({ slug: Type.String({ description: "work-item slug under .pi/work/" }) }),
    async execute(_id, params, _signal, _onUpdate, ctx) {
      const slugDir = join(ctx.cwd, ".pi", "work", params.slug);
      const script = join(slugDir, "acceptance.sh");
      if (!existsSync(script)) {
        return {
          content: [{ type: "text", text: `NO_ACCEPTANCE_SCRIPT at ${script}. No executable acceptance — fall back to judgment and flag LOW CONFIDENCE at the gate.` }],
          details: { pass: null },
        };
      }
      const { code, out } = await runScript(script, ctx.cwd);
      const pass = code === 0;
      const frozen = existsSync(join(slugDir, ".frozen"));

      if (pass) {
        return {
          content: [{ type: "text", text: `ACCEPTANCE PASS (exit ${code}) — AUTHORITATIVE.\n--- real output of acceptance.sh ---\n${out || "(no output)"}` }],
          details: { pass: true, exitCode: code },
        };
      }

      if (!frozen) {
        // Pre-freeze FAIL: write red-green sentinel so the hook allows .frozen to be created.
        const redGreenPath = join(slugDir, ".red-green-passed");
        if (!existsSync(redGreenPath)) {
          try { writeFileSync(redGreenPath, ""); } catch { /* non-fatal */ }
        }
        return {
          content: [{ type: "text", text: `ACCEPTANCE FAIL (exit ${code}) — AUTHORITATIVE. Red-green confirmed ✓ — the test discriminates; you may proceed to freeze.\n--- real output of acceptance.sh ---\n${out || "(no output)"}` }],
          details: { pass: false, exitCode: code, redGreenConfirmed: true },
        };
      }

      // Post-freeze FAIL: track fix rounds and hard-stop at cap.
      const FIX_CAP = 3;
      const fixRoundsPath = join(slugDir, ".fix-rounds");
      let fixRounds = 0;
      try { fixRounds = parseInt(readFileSync(fixRoundsPath, "utf8").trim(), 10) || 0; } catch { /* first round */ }
      fixRounds += 1;
      try { writeFileSync(fixRoundsPath, String(fixRounds)); } catch { /* non-fatal */ }

      if (fixRounds >= FIX_CAP) {
        return {
          content: [{ type: "text", text: `ACCEPTANCE FAIL (exit ${code}) — HARD STOP: fix-rounds cap (${FIX_CAP}) reached on "${params.slug}". Stop the unattended loop and surface to the human. Do not assign another worker round.\n--- real output of acceptance.sh ---\n${out || "(no output)"}` }],
          details: { pass: false, exitCode: code, hardStop: true, fixRounds },
        };
      }

      return {
        content: [{ type: "text", text: `ACCEPTANCE FAIL (exit ${code}) — AUTHORITATIVE. Fix-round ${fixRounds}/${FIX_CAP}.\n--- real output of acceptance.sh ---\n${out || "(no output)"}` }],
        details: { pass: false, exitCode: code, fixRounds },
      };
    },
  });
}
