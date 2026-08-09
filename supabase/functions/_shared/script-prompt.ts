// ─── SCRIPT PROMPT ASSEMBLY — SINGLE SOURCE OF TRUTH ──────────────────────────
// The generate-script counterpart to _shared/idea-prompt.ts, and it exists for
// the same reason.
//
// generate-video-topics once assembled its prompt inline while the test
// harnesses mirrored that assembly by hand. The mirror drifted: the harnesses
// included STANCE and INTEGRITY, the real function never imported them, and
// four rounds of green tests sat on top of a live path that was asserting
// named-state law. generate-script was left assembling inline afterward, which
// meant the same class of bug could sit in it undetected — and an audit
// (AUDIT_ideas_vs_script.md, Finding A) found that it already did: the
// director's taboo_topics list reached the prompt only on the my-voice tone.
//
// The rule: the edge function and every test MUST import these builders.
// Nothing reconstructs a script prompt by hand. If a test needs a different
// prompt, change it HERE so production changes with it.

import {
  FORBIDDEN, AUDIENCE, BIZ_CONTEXT, CAT_CONTEXT, PLATFORM_CONTEXT,
  STANCE, INTEGRITY, EXEMPLARS, bizLabelFor,
} from "./content-context.ts";

// The UI offers only the warm lineup (compassionate-educator, neighbor,
// comforting-guide, plus the My Voice persona path). The remaining keys are
// retained as ALIASES, not dead code: `saved_ideas.script_tone` persists a
// tone per saved script, so a previously-generated script can still send
// `straight-shooter` / `insider` / `industry-insider` / `myth-buster` /
// `myth-buster-legacy` on regenerate. Removing them would fall back to the
// default voice silently. Keep unless that persistence goes away.
export const TONE_CONTEXT: Record<string, string> = {
  "straight-shooter": "TONE: Direct, confident, plain-spoken. Says the real thing clearly and kindly. Direct is not cold.",
  "myth-buster": "TONE: Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
  "insider": "TONE: A generous expert sharing what families wish they'd known sooner — knowledgeable and open, never 'exposing' the industry.",
  "neighbor": "TONE: Warm but real. Talks like a knowledgeable person having a genuine conversation — not a professional delivering a presentation.",
  "compassionate-educator": "TONE: Warm, educational, and caring. Speak like a funeral director who genuinely wants families to understand their options. Informative but human.",
  "industry-insider": "TONE: Confident and knowledgeable. Shares real expertise plainly, the way a seasoned professional educates — direct, never conspiratorial.",
  "myth-buster-legacy": "TONE: Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
  "comforting-guide": "TONE: Soft, supportive. Like a trusted friend helping someone through something difficult while giving them real information."
};

// ─── VOICE PROFILE BUILDER ────────────────────────────────────────────────────
// The FULL persona block, used only when tone === 'my-voice'. Idea titles get
// the narrowed version in _shared/idea-voice.ts instead — see that file for
// what is deliberately held back from a menu of eight headlines and why.
export function buildVoicePrompt(vp: any): string {
  let prompt = `VOICE PROFILE — Write the script AS this specific funeral professional:\n\n`;

  if (vp.funeral_home_name) prompt += `They work at ${vp.funeral_home_name}. `;
  if (vp.years_experience) prompt += `${vp.years_experience} years of experience. `;
  if (vp.specialties) prompt += `Specialties: ${vp.specialties}. `;

  const toneMap: Record<string, string> = {
    'warm-empathetic': 'Warm, empathetic, caring. Like a trusted friend who also happens to be a funeral professional.',
    'professional-authoritative': 'Confident and authoritative. An expert families trust completely.',
    'down-to-earth': 'Casual, approachable, real. Talks about tough topics in a relatable way.',
    'reverent-formal': 'Dignified, respectful, traditional.',
  };
  if (vp.tone_descriptor) prompt += `\nTONE: ${toneMap[vp.tone_descriptor] || vp.tone_descriptor}`;

  if (vp.target_audience_age) {
    const ageMap: Record<string, string> = {
      'millennials': 'Target: Millennials 25-40. Casual, relatable.',
      'gen-x': 'Target: Gen X 40-55. Practical, direct.',
      'boomers': 'Target: Boomers 55+. Traditional, respectful.',
      'all-ages': 'Target: All ages. Universal language.',
    };
    prompt += `\nAUDIENCE: ${ageMap[vp.target_audience_age] || vp.target_audience_age}`;
  }

  if (vp.pacing_style) {
    const pacingMap: Record<string, string> = {
      'short-punchy': 'Short punchy sentences. Rapid delivery.',
      'mixed': 'Natural mix of short and longer sentences.',
      'flowing': 'Flowing sentences with storytelling cadence.',
    };
    prompt += `\nPACING: ${pacingMap[vp.pacing_style] || vp.pacing_style}`;
  }

  if (vp.cta_style) {
    const ctaMap: Record<string, string> = {
      'soft-ask': 'Soft close — "If this helped, consider sharing it."',
      'direct-cta': 'Direct CTA — "Follow for more and drop a comment."',
      'question': 'End with a question to spark comments.',
      'emotional-close': 'Emotional close — "You don\'t have to go through this alone."',
    };
    prompt += `\nCTA STYLE: ${ctaMap[vp.cta_style] || vp.cta_style}`;
  }

  if (vp.audience_address) prompt += `\nAddress the audience as "${vp.audience_address}".`;
  if (vp.signature_opening?.trim()) prompt += `\n\nSIGNATURE OPENING — Start with or inspired by: "${vp.signature_opening}"`;
  if (vp.content_pillars?.trim()) prompt += `\n\nCONTENT PILLARS: ${vp.content_pillars}`;
  if (vp.catchphrases?.trim()) prompt += `\n\nSIGNATURE PHRASES (weave in naturally): ${vp.catchphrases}`;
  if (vp.taboo_topics?.trim()) prompt += `\n\n⚠️ NEVER MENTION: ${vp.taboo_topics}`;
  if (vp.sample_script?.trim()) prompt += `\n\nSAMPLE OF HOW THIS PERSON SPEAKS — match this voice closely:\n"${vp.sample_script.slice(0, 1200)}"`;

  return prompt;
}

export interface ScriptPromptOptions {
  bizType: string;
  category: string;
  platform: string;
  tone: string;
  /** Full persona block from buildVoicePrompt; '' unless tone is my-voice. */
  voiceProfilePrompt?: string;
  /** Business-identity block (name/specialties/opening); '' when no profile. */
  businessIdentityPrompt?: string;
}

export function buildScriptSystemPrompt(opts: ScriptPromptOptions): string {
  const { bizType, category, platform, tone } = opts;
  const bizLabel = bizLabelFor(bizType);

  // 'my-voice' has no TONE_CONTEXT entry by design — the persona block replaces
  // the tone line entirely. A my-voice request from a user with no profile row
  // therefore falls through to the default warm voice, never to a provocative one.
  const toneGuide = (tone === 'my-voice' && opts.voiceProfilePrompt)
    ? opts.voiceProfilePrompt
    : TONE_CONTEXT[tone] || TONE_CONTEXT["compassionate-educator"];

  return [
    `You write 45-second teleprompter-ready video scripts for ${bizLabel}s to post on social media.`,
    `The script is written FROM the funeral professional's perspective — they are speaking on camera as the expert.`,
    AUDIENCE,
    // STANCE governs the facts that follow it; INTEGRITY sits immediately
    // after them. Same ordering generate-video-topics uses.
    STANCE,
    BIZ_CONTEXT[bizType] || BIZ_CONTEXT["funeral-home"],
    INTEGRITY,
    CAT_CONTEXT[category] || CAT_CONTEXT["demystify"],
    PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT["facebook"],
    toneGuide,
    opts.businessIdentityPrompt || "",
    FORBIDDEN,
    `SCRIPT FORMAT:
HOOK (first 1-3 sentences): Most interesting thing first. No setup. No intro. No "hey guys." Must earn the next 40 seconds on its own.
BODY: Natural spoken language — not prose, not a brochure. Short sentences. [PAUSE] markers where the speaker breathes or lets a point land. Concrete, specific language — real steps, real experience, sensory detail. Where a real number, price, or timeframe belongs, insert a [placeholder] for the director to fill rather than inventing one. Specifics that are TRUE get shared; invented specifics get the director in trouble.
CTA: One real, specific ask. NOT "like and subscribe." Something that creates genuine connection: "Drop your question below," "DM me the word PLAN," "Save this — your family needs to see it."




LENGTH: Under 120 words total (45 seconds spoken aloud).
NO emojis in the script.
NO jargon without immediate plain-language explanation.
If it sounds like it was written by a marketing committee — rewrite it.`,
    EXEMPLARS
  ].filter(Boolean).join('\n\n');
}

export interface ScriptUserMessageOptions {
  bizType: string;
  idea: string;
  /** Appended on the anti-repetition retry; '' on the first attempt. */
  avoidInstruction?: string;
}

export function buildScriptUserMessage(opts: ScriptUserMessageOptions): string {
  const bizLabel = bizLabelFor(opts.bizType);

  return `Write a 45-second script for a ${bizLabel} about: "${opts.idea}"




CRITICAL REQUIREMENTS:
1. The HOOK must be the most RESONANT thing about this topic — the real question families are afraid to ask, or the reassurance they most need. Straight in, no scene-setting. Surprising is fine; a gotcha or "they don't want you to know" angle is not.
2. The BODY must be concrete and specific in LANGUAGE, but must NOT state any price, number, temperature, or timeline that isn't provided — use a [placeholder] instead. Concrete does not mean invented.
3. The CTA is REQUIRED — end with one specific action for the viewer to take.
4. CHECK YOUR GRAMMAR before returning. Every sentence must be grammatically correct.
5. Also write TWO ALTERNATE HOOKS that open the same script a different way — a different angle, not a reworded version of the first. Each alternate must work as the opening line of the same body.${opts.avoidInstruction || ''}

Return ONLY valid JSON, no markdown, no code fences:
{"hook":"opening hook lines","hookVariants":["alternate hook 1","alternate hook 2"],"body":"main content with [PAUSE] markers","cta":"closing call to action","wordCount":95}`;
}

/** The anti-repetition retry instruction, appended to the user message. */
export function buildAvoidInstruction(previousHook: string): string {
  return `
6. IMPORTANT — ANTI-REPETITION: This account has already received a very similar script on this topic. Take a genuinely DIFFERENT angle: a different insider fact for the hook, a different structure, different specifics. Do NOT reuse or lightly reword this previous opening: "${String(previousHook || '').slice(0, 160)}"`;
}
