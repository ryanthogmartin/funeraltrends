// Structural coverage for BOTH prompt paths, through the real builders.
// No tokens spent — this is the check that runs before any live harness.
//
//   deno test supabase/functions/_tests/

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  checkScriptPrompt, checkIdeaPrompt, selfTest,
  SHARED_REQUIRED, IDEA_REQUIRED,
} from "./structural-guard.ts";
import { buildScriptSystemPrompt, buildVoicePrompt } from "../_shared/script-prompt.ts";
import { buildIdeaSystemPrompt } from "../_shared/idea-prompt.ts";

const BIZ = ["funeral-home", "cemetery", "crematory", "pet-cremation", "unknown-vertical"];
const CAT = ["demystify", "value", "legal", "preplanning", "mythbust", "unknown-cat"];
const PLAT = ["facebook", "reels", "youtube", "unknown-plat"];
const TONE = [
  "compassionate-educator", "neighbor", "comforting-guide", "my-voice",
  "straight-shooter", "myth-buster", "myth-buster-legacy", "insider",
  "industry-insider", "unknown-tone",
];

// ── The guard must be able to fail ────────────────────────────────────────────
// If this is the only test that ever breaks, everything below is decoration.

Deno.test("guard has teeth — every required block is actually detected when absent", () => {
  assertEquals(selfTest(), [], "checker failed to notice these blocks were missing");
});

// ── Ideas path ────────────────────────────────────────────────────────────────
// This is the path that shipped broken for four rounds.

Deno.test("ideas prompt carries the full safety layer across every input combination", () => {
  const broken: string[] = [];
  for (const bizType of BIZ) {
    for (const category of CAT) {
      for (const platform of PLAT) {
        for (const tone of TONE) {
          const { ok, failures } = checkIdeaPrompt({ bizType, category, platform, tone });
          if (!ok) broken.push(`${bizType}/${category}/${platform}/${tone}: ${failures.join("; ")}`);
        }
      }
    }
  }
  assertEquals(broken, []);
});

Deno.test("ideas safety layer survives business identity and persona voice blocks", () => {
  const { ok, failures } = checkIdeaPrompt({
    bizType: "crematory", category: "legal", platform: "reels", tone: "my-voice",
    businessIdentityPrompt: "BUSINESS IDENTITY — make these ideas specific to THIS business:\n- x",
    ideaVoicePrompt: "SPEAKER'S VOICE — write the titles in this person's words:\n- y",
  });
  assertEquals(failures, []);
  assertEquals(ok, true);
});

// ── Scripts path ──────────────────────────────────────────────────────────────
// Uncovered until now. Finding C in AUDIT_ideas_vs_script.md.

Deno.test("script prompt carries the full safety layer across every input combination", () => {
  const broken: string[] = [];
  for (const bizType of BIZ) {
    for (const category of CAT) {
      for (const platform of PLAT) {
        for (const tone of TONE) {
          const { ok, failures } = checkScriptPrompt({ bizType, category, platform, tone });
          if (!ok) broken.push(`${bizType}/${category}/${platform}/${tone}: ${failures.join("; ")}`);
        }
      }
    }
  }
  assertEquals(broken, []);
});

Deno.test("script safety layer survives the full my-voice persona block", () => {
  // The persona block is the largest chunk of user-authored text in either
  // prompt, and on my-voice it REPLACES the tone line. Assert the safety layer
  // is still intact around it.
  const voiceProfilePrompt = buildVoicePrompt({
    funeral_home_name: "Lone Star Rest", years_experience: 22, specialties: "green burial",
    tone_descriptor: "down-to-earth", target_audience_age: "gen-x", pacing_style: "mixed",
    cta_style: "question", audience_address: "yall", signature_opening: "Howdy folks",
    content_pillars: "pre-planning", catchphrases: "y'all take care",
    sample_script: "Well now, lemme tell ya about somethin'.",
  });
  const { failures } = checkScriptPrompt({
    bizType: "funeral-home", category: "mythbust", platform: "facebook",
    tone: "my-voice", voiceProfilePrompt,
  });
  assertEquals(failures, []);
});

// ── Cross-path parity ─────────────────────────────────────────────────────────
// The audit exists because the two paths drifted. Assert they cannot silently
// diverge on the shared safety layer again.

Deno.test("both paths carry an identical shared safety layer", () => {
  const script = buildScriptSystemPrompt({
    bizType: "funeral-home", category: "legal", platform: "facebook", tone: "compassionate-educator",
  });
  const ideas = buildIdeaSystemPrompt({
    bizType: "funeral-home", category: "legal", platform: "facebook", tone: "compassionate-educator",
  });
  const missing = SHARED_REQUIRED
    .filter((b) => script.includes(b.marker) !== ideas.includes(b.marker))
    .map((b) => b.name);
  assertEquals(missing, [], "these blocks reach one path but not the other");
});

Deno.test("STANCE governs the business facts, INTEGRITY follows them — both paths", () => {
  for (const [label, prompt] of [
    ["script", buildScriptSystemPrompt({ bizType: "crematory", category: "demystify", platform: "facebook", tone: "neighbor" })],
    ["ideas", buildIdeaSystemPrompt({ bizType: "crematory", category: "demystify", platform: "facebook", tone: "neighbor" })],
  ] as [string, string][]) {
    const stance = prompt.indexOf("STANCE — READ BEFORE ANYTHING ELSE:");
    const biz = prompt.indexOf("BUSINESS: Crematory Operator");
    const integrity = prompt.indexOf("FACTUAL INTEGRITY — HARD RULE");
    assertEquals(stance < biz && biz < integrity, true, `${label}: STANCE → BIZ_CONTEXT → INTEGRITY order broken`);
  }
});

// ── Regression pin for the bug that started all this ──────────────────────────

Deno.test("the named-state and unembalmed-viewing rules reach BOTH paths on a legal topic", () => {
  const opts = { bizType: "funeral-home", category: "legal", platform: "facebook", tone: "compassionate-educator" };
  for (const [label, prompt] of [
    ["script", buildScriptSystemPrompt(opts)],
    ["ideas", buildIdeaSystemPrompt(opts)],
  ] as [string, string][]) {
    for (const block of SHARED_REQUIRED.filter((b) => b.name === "stateRule" || b.name === "viewingRule")) {
      assertEquals(prompt.includes(block.marker), true, `${label} is missing ${block.name}`);
    }
  }
});

Deno.test("PRECEDENCE is an ideas-path rule and is present on every tone", () => {
  const marker = IDEA_REQUIRED[0].marker;
  for (const tone of TONE) {
    const prompt = buildIdeaSystemPrompt({ bizType: "funeral-home", category: "demystify", platform: "facebook", tone });
    assertEquals(prompt.includes(marker), true, `PRECEDENCE missing on tone ${tone}`);
  }
});
