// ─── COST HARNESS — what a script generation actually costs ───────────────────
// Answers three questions with measured numbers, not estimates:
//   1. The exact input/output token split for a real assembled script prompt.
//   2. What prompt caching would save (or cost) on this workload.
//   3. What the retry multiplies.
//
// Rules, same as live-harness.ts: it imports the REAL builders and contains no
// prompt text of its own; it never prints the API key.
//
//   ~/.deno/bin/deno run --allow-read --allow-write --allow-net --allow-env supabase/functions/_tests/cost-harness.ts
//
// Key protocol: throwaway key at ~/.anthropic_test_key, deleted on exit. The
// real cleanup is revoking it in the console.

import { buildScriptSystemPrompt, buildScriptUserMessage, buildAvoidInstruction } from "../_shared/script-prompt.ts";
import { buildTabooBlock, EXEMPLARS } from "../_shared/content-context.ts";

const MODEL = "claude-sonnet-5";
const KEY_PATH = `${Deno.env.get("HOME")}/.anthropic_test_key`;
const DELAY_MS = 3500;

// Sonnet 5 list price per million tokens. Intro pricing runs through
// 2026-08-31; standard applies from 2026-09-01. Cache multipliers apply to the
// INPUT rate: reads ~0.1x, 5-minute writes 1.25x.
const RATES = {
  intro:    { in: 2.00, out: 10.00 },
  standard: { in: 3.00, out: 15.00 },
};
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_MULT = 1.25;

let apiKey = "";
const transcript: string[] = [];
const out = (l = "") => { console.log(l); transcript.push(l); };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

async function countTokens(system: unknown, user: string): Promise<number> {
  const res = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`count_tokens ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).input_tokens;
}

async function generate(system: unknown, user: string): Promise<Usage> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, thinking: { type: "disabled" }, system,
      messages: [{ role: "user", content: user }], max_tokens: 1000,
    }),
  });
  if (!res.ok) throw new Error(`messages ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).usage;
}

/** Cost in dollars for one generation's usage, at a given rate card. */
function cost(u: Usage, r: { in: number; out: number }): number {
  const fresh = (u.input_tokens / 1e6) * r.in;
  const read = ((u.cache_read_input_tokens ?? 0) / 1e6) * r.in * CACHE_READ_MULT;
  const write = ((u.cache_creation_input_tokens ?? 0) / 1e6) * r.in * CACHE_WRITE_MULT;
  const output = (u.output_tokens / 1e6) * r.out;
  return fresh + read + write + output;
}

const usd = (n: number) => `$${n.toFixed(5)}`;

const BASE = { bizType: "funeral-home", category: "demystify", platform: "facebook", tone: "compassionate-educator" };
const IDENTITY = "BUSINESS IDENTITY — make this script specific to THIS business, not generic to the profession:\n- The speaker works at Cedar Rest. Mention the business naturally where it fits (once, not as an ad).";
const IDEA = "what families should know about pre-planning";

async function main() {
  apiKey = (await Deno.readTextFile(KEY_PATH)).trim();
  if (!apiKey) throw new Error("key file is empty");

  const sys = buildScriptSystemPrompt({ ...BASE, businessIdentityPrompt: IDENTITY, tabooPrompt: buildTabooBlock("avoid politics") });
  const user = buildScriptUserMessage({ bizType: BASE.bizType, idea: IDEA });
  const userRetry = buildScriptUserMessage({ bizType: BASE.bizType, idea: IDEA, avoidInstruction: buildAvoidInstruction("A family asked me last week") });

  // ── 1. Exact input split ───────────────────────────────────────────────────
  out("=".repeat(78));
  out("1. INPUT TOKENS — exact, via /v1/messages/count_tokens on the real builders");
  out("=".repeat(78));
  const inFull = await countTokens(sys, user);
  const inNoExemplars = await countTokens(sys.replace(EXEMPLARS, "").trimEnd(), user);
  const inUserOnly = await countTokens("", user);
  const inRetryUser = await countTokens(sys, userRetry);
  out(`  full system + user message      ${String(inFull).padStart(6)} tokens`);
  out(`    user message alone            ${String(inUserOnly).padStart(6)}`);
  out(`    system prompt                 ${String(inFull - inUserOnly).padStart(6)}`);
  out(`    ...of which EXEMPLARS         ${String(inFull - inNoExemplars).padStart(6)}  (${(((inFull - inNoExemplars) / inFull) * 100).toFixed(1)}% of input)`);
  out(`  retry variant (adds avoid text) ${String(inRetryUser).padStart(6)}  (+${inRetryUser - inFull})`);
  out("");

  // ── 2. Real generations — output tokens from the usage field ───────────────
  out("=".repeat(78));
  out("2. OUTPUT TOKENS — from the `usage` field of real generations");
  out("=".repeat(78));
  const runs: Usage[] = [];
  for (let i = 1; i <= 3; i++) {
    const u = await generate(sys, user);
    runs.push(u);
    out(`  run ${i}: input ${u.input_tokens}  output ${u.output_tokens}   ` +
        `intro ${usd(cost(u, RATES.intro))}   standard ${usd(cost(u, RATES.standard))}`);
    await sleep(DELAY_MS);
  }
  const avg = (f: (u: Usage) => number) => runs.reduce((a, u) => a + f(u), 0) / runs.length;
  const avgIn = avg((u) => u.input_tokens), avgOut = avg((u) => u.output_tokens);
  const meanUsage: Usage = { input_tokens: avgIn, output_tokens: avgOut };
  out("");
  out(`  MEAN  input ${avgIn.toFixed(0)}  output ${avgOut.toFixed(0)}   ratio ${(avgIn / avgOut).toFixed(1)}:1 input-dominated`);
  out(`  cost per generation (1 call):  intro ${usd(cost(meanUsage, RATES.intro))}   standard ${usd(cost(meanUsage, RATES.standard))}`);
  const inShare = ((avgIn / 1e6) * RATES.standard.in) / cost(meanUsage, RATES.standard);
  out(`  input share of cost: ${(inShare * 100).toFixed(1)}%   output share: ${((1 - inShare) * 100).toFixed(1)}%`);
  out("");

  // ── 3. Caching A/B ─────────────────────────────────────────────────────────
  out("=".repeat(78));
  out("3. PROMPT CACHING — measured, not assumed");
  out("  Breakpoint on the last system block. Call A writes, call B reads.");
  out("=".repeat(78));
  const cachedSys = [{ type: "text", text: sys, cache_control: { type: "ephemeral" } }];
  const a = await generate(cachedSys, user);
  out(`  A (write): fresh ${a.input_tokens}  write ${a.cache_creation_input_tokens ?? 0}  read ${a.cache_read_input_tokens ?? 0}  out ${a.output_tokens}`);
  await sleep(DELAY_MS);
  const b = await generate(cachedSys, user);
  out(`  B (read):  fresh ${b.input_tokens}  write ${b.cache_creation_input_tokens ?? 0}  read ${b.cache_read_input_tokens ?? 0}  out ${b.output_tokens}`);
  out("");
  const cachedHit = (b.cache_read_input_tokens ?? 0) > 0;
  out(`  cache actually hit on B: ${cachedHit}`);
  for (const [label, r] of [["intro", RATES.intro], ["standard", RATES.standard]] as const) {
    const uncached2 = cost(meanUsage, r) * 2;
    const cached2 = cost(a, r) + cost(b, r);
    out(`  ${label.padEnd(9)} two generations — uncached ${usd(uncached2)}  cached ${usd(cached2)}  ` +
        `${cached2 < uncached2 ? "saves" : "COSTS"} ${usd(Math.abs(uncached2 - cached2))} (${(((cached2 - uncached2) / uncached2) * 100).toFixed(1)}%)`);
    out(`  ${"".padEnd(9)} ONE generation  — uncached ${usd(cost(meanUsage, r))}  cached ${usd(cost(a, r))}  ` +
        `${cost(a, r) > cost(meanUsage, r) ? "COSTS" : "saves"} ${usd(Math.abs(cost(a, r) - cost(meanUsage, r)))} more`);
  }
  out("");

  // ── 4. What the retry multiplies ───────────────────────────────────────────
  out("=".repeat(78));
  out("4. THE RETRY — cost of a generation that fires it vs one that doesn't");
  out("=".repeat(78));
  for (const [label, r] of [["intro", RATES.intro], ["standard", RATES.standard]] as const) {
    const one = cost(meanUsage, r);
    const two = one * 2;
    out(`  ${label.padEnd(9)} no retry ${usd(one)}   retry fires ${usd(two)}   multiplier 2.00x on that generation`);
    for (const rate of [0.05, 0.10, 0.25, 0.50]) {
      out(`  ${"".padEnd(9)}   at ${(rate * 100).toFixed(0).padStart(2)}% trigger rate → blended ${usd(one * (1 + rate))} per generation (${(1 + rate).toFixed(2)}x)`);
    }
  }
  out("");
  out(`Total Anthropic calls: ${runs.length + 2} generations + 4 count_tokens`);
}

try {
  await main();
} finally {
  try {
    await Deno.remove(KEY_PATH);
    out(`\nDeleted ${KEY_PATH}. REVOKE THE KEY IN THE CONSOLE — that is the real cleanup.`);
  } catch { /* already gone */ }
  try {
    await Deno.writeTextFile(`${Deno.cwd()}/COST_RUN.txt`, transcript.join("\n"));
  } catch (e) {
    console.error("could not write transcript:", e instanceof Error ? e.message : e);
  }
}
