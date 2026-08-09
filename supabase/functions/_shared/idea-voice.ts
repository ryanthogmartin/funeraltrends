// ─── PERSONA VOICE FOR IDEA TITLES (middle option) ────────────────────────────
// Scripts get the full persona via generate-script's buildVoicePrompt: signature
// opening, catchphrases, pacing, CTA style, and a sample script whose dialect the
// model imitates. That is deliberately TOO MUCH for a menu of eight titles —
// sign-off phrases ("Y'all take care now, ya hear?") read badly as headlines, and
// phonetic spelling ("scribblin'", "more'n") gets tiring when scanned in a list.
//
// This builds the narrower block used by generate-video-topics for "My Voice":
// vocabulary, how they address the audience, and the world they work in —
// word choice and subject matter, NOT accent or performance.
//
// Deliberately EXCLUDED (script-only): signature_opening, catchphrases,
// sample_script, pacing_style, cta_style.
//
// taboo_topics is NOT in that list and must not be added to it. Every field
// above is a performance flourish that reads badly repeated across eight
// headlines; taboo_topics is a prohibition, which has no such downside. It is
// applied to BOTH paths and every tone via buildTabooBlock() in
// content-context.ts — not here, because it is a constraint, not a voice.

export function buildIdeaVoicePrompt(vp: Record<string, unknown>): string {
  const bits: string[] = [];

  const vocabMap: Record<string, string> = {
    'everyday': 'Plain, everyday words. No industry jargon, nothing that sounds like a brochure.',
    'professional': 'Professional but accessible — precise terms, explained in plain language.',
    'simple': 'Simple, direct words. Short and unmistakable.',
  };
  const vocabulary = typeof vp.vocabulary_level === 'string' ? vp.vocabulary_level : '';
  if (vocabulary) {
    bits.push(`- VOCABULARY: ${vocabMap[vocabulary] || vocabulary}`);
  }

  const address = typeof vp.audience_address === 'string' ? vp.audience_address.trim() : '';
  if (address) {
    // Stored values may be slugs ("yall") or literal ("y'all"); normalize the
    // common slug so the model is told the real word it should write.
    const spoken = address.toLowerCase() === 'yall' ? "y'all" : address;
    bits.push(`- AUDIENCE ADDRESS: they say "${spoken}" when speaking directly to the viewer. Use it where a title naturally addresses them — not in every title.`);
  }

  const toneMap: Record<string, string> = {
    'warm-empathetic': 'warm and empathetic',
    'professional-authoritative': 'confident and authoritative',
    'down-to-earth': 'casual and down-to-earth',
    'reverent-formal': 'dignified and traditional',
  };
  const toneDescriptor = typeof vp.tone_descriptor === 'string' ? vp.tone_descriptor : '';
  if (toneDescriptor) {
    bits.push(`- REGISTER: ${toneMap[toneDescriptor] || toneDescriptor}.`);
  }

  const pillars = typeof vp.content_pillars === 'string' ? vp.content_pillars.trim() : '';
  if (pillars) {
    bits.push(`- THE SUBJECTS THEY RETURN TO: ${pillars}. Favor angles that live in this territory.`);
  }

  const audienceMap: Record<string, string> = {
    'millennials': 'adults 25-40',
    'gen-x': 'adults 40-55',
    'boomers': 'adults 55+',
    'all-ages': 'a wide range of ages',
  };
  const audienceAge = typeof vp.target_audience_age === 'string' ? vp.target_audience_age : '';
  if (audienceAge) {
    bits.push(`- WHO THEY'RE TALKING TO: ${audienceMap[audienceAge] || audienceAge}.`);
  }

  if (!bits.length) return '';

  return `SPEAKER'S VOICE — write the titles in this person's words, about this person's world:
${bits.join('\n')}

Voice here means WORD CHOICE and SUBJECT MATTER, not accent or performance:
- Use standard spelling. Never write phonetic or dialect spelling ("scribblin'", "more'n", "'til") — write "scribbling", "more than", "until".
- Do NOT open titles with their signature greeting, and do NOT use their catchphrases or sign-off phrases as titles. Those belong in a script, not on a menu.
- The eight titles still have to work as a scannable list. Character should come from the specifics they'd actually mention, not from repeated verbal tics.`;
}
