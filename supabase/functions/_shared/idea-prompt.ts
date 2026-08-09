// ─── IDEA PROMPT ASSEMBLY — SINGLE SOURCE OF TRUTH ────────────────────────────
// Why this module exists:
//
// generate-video-topics used to assemble its system prompt inline, and the
// verification harnesses mirrored that assembly by hand. The mirror drifted:
// the harnesses included STANCE and INTEGRITY, the real function never
// imported them. Every "PASS" on the ideas path was therefore measuring a
// prompt production does not build, and live output asserted named-state law
// for four rounds without a single test catching it.
//
// The rule that follows: the edge function and every test MUST import these
// builders. Nothing reconstructs an idea prompt by hand. If a test needs a
// different prompt, change it HERE so production changes with it.

import {
  FORBIDDEN, AUDIENCE, BIZ_CONTEXT, CAT_CONTEXT, PLATFORM_CONTEXT,
  STANCE, INTEGRITY, BIZ_LABELS, bizLabelFor,
} from "./content-context.ts";

// Re-exported for existing importers; the definitions now live in
// content-context.ts so generate-script shares the same copy.
export { BIZ_LABELS, bizLabelFor };

// Must cover every key the UI can send, plus the keys retired from the UI but
// kept as aliases (an old stored selection can still arrive here). An unknown
// key falls back to the default warm voice — never to a provocative one.
export const TONE_LABELS: Record<string, string> = {
  "compassionate-educator": "Warm, educational, and caring. Speaks like a funeral director who genuinely wants families to understand their options.",
  "neighbor": "Warm but real. Knowledgeable person talking, not a professional presenting.",
  "comforting-guide": "Soft, supportive. Like a trusted friend giving real information through something difficult.",
  "my-voice": "Warm, personal, and specific to this business — the way this director actually talks to families.",
  // Retired from the UI; retained so previously-stored selections resolve.
  "straight-shooter": "Direct, confident, plain-spoken. Says the real thing clearly and kindly.",
  "myth-buster": "Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
  "myth-buster-legacy": "Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
  "insider": "A generous expert sharing what families wish they'd known sooner — knowledgeable and open.",
  "industry-insider": "Confident and knowledgeable. Shares real expertise plainly, the way a seasoned professional educates.",
};

export interface IdeaPromptOptions {
  bizType: string;
  category: string;
  platform: string;
  tone: string;
  /** Business-identity block (name/specialties); '' when the user has no profile. */
  businessIdentityPrompt?: string;
  /** Narrowed persona-voice block; '' unless tone is my-voice. */
  ideaVoicePrompt?: string;
  /** Per-business off-limits list; '' when the director set none. Every tone. */
  tabooPrompt?: string;
}

export function buildIdeaSystemPrompt(opts: IdeaPromptOptions): string {
  const { bizType, category, platform, tone } = opts;
  const bizLabel = bizLabelFor(bizType);

  return [
    `You generate short-form video ideas for ${bizLabel}s to post on social media.`,
    `Each idea is a video TITLE that doubles as the opening hook — it must be compelling enough to stop someone scrolling on its own.`,
    AUDIENCE,
    // STANCE governs the facts that follow it; INTEGRITY sits immediately
    // after them. Same ordering generate-script uses.
    STANCE,
    BIZ_CONTEXT[bizType] || BIZ_CONTEXT["funeral-home"],
    INTEGRITY,
    CAT_CONTEXT[category] || CAT_CONTEXT["demystify"],
    PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT["facebook"],
    `TONE: ${TONE_LABELS[tone] || TONE_LABELS["compassionate-educator"]}`,
    opts.businessIdentityPrompt || "",
    opts.ideaVoicePrompt || "",
    FORBIDDEN,
    // Immediately after FORBIDDEN — the other never-say block — so the
    // director's own free text never lands inside the STANCE/INTEGRITY layer,
    // while still sitting upstream of the format rules. Same slot in
    // buildScriptSystemPrompt, so the two paths stay diffable.
    opts.tabooPrompt || "",
    `RULES FOR IDEAS:
- Statements or reveals — NOT questions
- Use real words (die, death, cost, body) — not euphemisms
- Specific beats vague every time: "The 4 documents you need within 48 hours of a death" beats "What to do when someone dies"
- Each idea should be something the viewer couldn't have Googled to find at the top of results — insider knowledge and unexpected angles, the things families are relieved to learn from someone who does this work
- If it sounds like generic AI content — make it more specific: the details only someone who does this work day to day would know
- PRECEDENCE: the STANCE and FACTUAL INTEGRITY rules above outrank every rule in this list. "Statements not questions" and "specific beats vague" are style guidance, not permission to assert law or to sell an exception. Where the punchier title would break one of those rules, write the less punchy title.`,
    `The 8 ideas MUST be genuinely distinct — not 8 rewordings of one angle. Deliberately vary the ENTRY POINT across the set, drawing from different ones: a myth to gently correct, a real question a family asked, a behind-the-scenes/process moment, a legal or decision point, a pre-planning nudge, a cost/value explanation, a short personal story, an emotional reassurance. Vary the FORMAT too (direct answer, story, comparison, "what to expect," step-by-step). No more than two of the eight may lean on the same underlying fact. On a narrow topic, find fresh angles ON the topic rather than repeating the single most obvious one.`,
    `Return ONLY valid JSON, no markdown: {"ideas":["idea 1","idea 2","idea 3","idea 4","idea 5","idea 6","idea 7","idea 8"]}`,
  ].filter(Boolean).join("\n\n");
}

export interface IdeaUserMessageOptions {
  inputMode: string;
  activeTopic: string;
  bizType: string;
  /** Titles already shown for this topic, appended as an avoid-list. */
  priorTitles?: string[];
}

export function buildIdeaUserMessage(opts: IdeaUserMessageOptions): string {
  const bizLabel = bizLabelFor(opts.bizType);
  const t = opts.activeTopic;

  const byMode: Record<string, string> = {
    "keyword": `Generate 8 video ideas for a ${bizLabel} about the topic: "${t}"`,
    "question": `A family keeps asking this question: "${t}" — Generate 8 different video angles a ${bizLabel} could make to answer this, each with a different hook or approach.`,
    "free": `Generate 8 video ideas for a ${bizLabel} about: "${t}"`,
  };

  let msg = byMode[opts.inputMode] || byMode["keyword"];

  const prior = opts.priorTitles || [];
  if (prior.length) {
    msg += `\n\nThese angles were already generated for this topic — produce 8 that are genuinely DIFFERENT from these, using different entry points and formats:\n${prior.map((x) => `- ${x}`).join("\n")}`;
  }
  return msg;
}
