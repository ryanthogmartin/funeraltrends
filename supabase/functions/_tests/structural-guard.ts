// ─── STRUCTURAL GUARD ─────────────────────────────────────────────────────────
// Asserts that the safety blocks actually reach the assembled prompt — on BOTH
// paths, through the REAL builders production calls.
//
// This exists because of a specific failure. generate-video-topics assembled
// its prompt inline while the verification harnesses reconstructed that
// assembly by hand. The hand copy included STANCE and INTEGRITY; the real
// function never imported them. Four rounds of green tests therefore measured
// a prompt production does not build, while live idea titles asserted
// named-state law under a licensed funeral director's name. The harness was
// the bug.
//
// Two rules follow, and both matter more than the assertions below:
//
//   1. Import the real builders. Never reconstruct a prompt here. If this file
//      ever contains prompt text of its own, it has become the bug it exists
//      to prevent.
//   2. The guard must be able to FAIL. `selfTest()` strips a required block
//      from a real prompt and asserts the checker catches it — a guard that
//      cannot fail is decoration. Run it before trusting a green result.
//
// Used two ways: by `prompt-structure.test.ts` (deno test, no tokens), and by
// live harnesses via `assertOrExit()` BEFORE any Anthropic spend.

import { buildScriptSystemPrompt, type ScriptPromptOptions } from "../_shared/script-prompt.ts";
import { buildIdeaSystemPrompt, type IdeaPromptOptions } from "../_shared/idea-prompt.ts";

/** Heading of the per-business off-limits block, when the director set one. */
export const TABOO_MARKER = "OFF-LIMITS FOR THIS BUSINESS — HARD CONSTRAINT:";

/** A block that must be present, identified by a distinctive substring of its real text. */
interface RequiredBlock {
  name: string;
  /** Verbatim slice of the block as it appears in content-context.ts. */
  marker: string;
  why: string;
}

/** Required on BOTH paths. Scripts and idea titles carry the same safety layer. */
export const SHARED_REQUIRED: RequiredBlock[] = [
  {
    name: "STANCE",
    marker: "STANCE — READ BEFORE ANYTHING ELSE:",
    why: "Without it the model sells, scares, or frames the profession as hiding things.",
  },
  {
    name: "INTEGRITY",
    marker: "FACTUAL INTEGRITY — HARD RULE",
    why: "Without it the model invents prices, timelines, and legal requirements.",
  },
  {
    name: "stateRule",
    marker: "pair a NAMED STATE with the requirement",
    why: "The exact rule whose absence let titles assert 'Texas does not require embalming by law'.",
  },
  {
    name: "viewingRule",
    marker: "A public viewing without embalming is technically possible but is rarely recommended",
    why: "Without it the unembalmed viewing gets sold as a normal, appealing option.",
  },
  {
    name: "refrigerationRule",
    marker: "Never present refrigeration as a general alternative or replacement for embalming",
    why: "Refrigeration buys time; embalming preserves for a viewing. Never an either/or.",
  },
  {
    name: "AUDIENCE",
    marker: "WHO IS WATCHING:",
    why: "Without it the model writes for the grieving rather than the curious.",
  },
  {
    name: "FORBIDDEN",
    marker: "FORBIDDEN — NEVER USE",
    why: "Without it the output reads like brochure copy.",
  },
];

/** Required on the ideas path only. */
export const IDEA_REQUIRED: RequiredBlock[] = [
  {
    name: "PRECEDENCE",
    marker: "PRECEDENCE: the STANCE and FACTUAL INTEGRITY rules above outrank",
    why: "Punchy-headline pressure beat the safety rules until precedence was stated outright.",
  },
];

/**
 * Ordering invariants, as [before, after] marker pairs.
 *
 * The STANCE → BIZ_CONTEXT → INTEGRITY → FORBIDDEN spine must hold on both
 * paths: STANCE governs the business facts that follow it, and INTEGRITY sits
 * immediately after them. Drift here is silent — every block is still present,
 * so a presence-only check passes while the prompt reads differently.
 */
export const ORDERING: [string, string][] = [
  ["WHO IS WATCHING:", "STANCE — READ BEFORE ANYTHING ELSE:"],
  ["STANCE — READ BEFORE ANYTHING ELSE:", "FACTUAL INTEGRITY — HARD RULE"],
  ["FACTUAL INTEGRITY — HARD RULE", "FORBIDDEN — NEVER USE"],
  // The director's free text must land AFTER the safety layer, never inside it.
  ["FORBIDDEN — NEVER USE", TABOO_MARKER],
];

export interface GuardResult {
  ok: boolean;
  failures: string[];
}

function checkPrompt(prompt: string, required: RequiredBlock[]): GuardResult {
  const failures: string[] = [];

  for (const block of required) {
    if (!prompt.includes(block.marker)) {
      failures.push(`MISSING ${block.name} — ${block.why}`);
    }
  }

  for (const [before, after] of ORDERING) {
    const i = prompt.indexOf(before);
    const j = prompt.indexOf(after);
    if (i !== -1 && j !== -1 && i > j) {
      failures.push(`OUT OF ORDER — "${before.slice(0, 32)}…" must precede "${after.slice(0, 32)}…"`);
    }
  }

  return { ok: failures.length === 0, failures };
}

/** Build the REAL script prompt and check it. */
export function checkScriptPrompt(opts: ScriptPromptOptions): GuardResult {
  return checkPrompt(buildScriptSystemPrompt(opts), SHARED_REQUIRED);
}

/** Build the REAL idea prompt and check it. */
export function checkIdeaPrompt(opts: IdeaPromptOptions): GuardResult {
  return checkPrompt(buildIdeaSystemPrompt(opts), [...SHARED_REQUIRED, ...IDEA_REQUIRED]);
}

/**
 * Proves the checker can fail. Takes a real prompt, removes each required
 * marker in turn, and confirms the checker reports it. Returns the names of
 * any blocks the checker FAILED to notice were missing — an empty array means
 * every assertion has teeth.
 */
export function selfTest(): string[] {
  const real = buildIdeaSystemPrompt({
    bizType: "funeral-home", category: "demystify", platform: "facebook", tone: "compassionate-educator",
  });
  const all = [...SHARED_REQUIRED, ...IDEA_REQUIRED];
  const notCaught: string[] = [];

  for (const block of all) {
    const mutilated = real.split(block.marker).join("");
    const { failures } = checkPrompt(mutilated, all);
    if (!failures.some((f) => f.startsWith(`MISSING ${block.name}`))) {
      notCaught.push(block.name);
    }
  }
  return notCaught;
}

/**
 * For LIVE harnesses: run before spending a single token. Prints FATAL and
 * exits non-zero if the real prompt is missing a safety block, so a run can
 * never produce green output on top of a broken prompt.
 */
export function assertOrExit(label: string, result: GuardResult): void {
  if (result.ok) {
    console.log(`✓ structural guard passed — ${label}`);
    return;
  }
  console.error(`\nFATAL — structural guard failed for ${label}:`);
  for (const f of result.failures) console.error(`  • ${f}`);
  console.error("\nRefusing to spend tokens against a prompt missing its safety layer.\n");
  Deno.exit(1);
}
