import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";




const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};




// ─── FORBIDDEN WORDS ──────────────────────────────────────────────────────────
const FORBIDDEN = `FORBIDDEN — NEVER USE ANY OF THESE IN THE SCRIPT:
dignified, compassionate, heartfelt, trusted professionals, loved one (say "your dad / your mom / your husband / your wife" instead), passing (say "when someone dies" or "after they die"), transition, journey (as death euphemism), at this difficult time, here for you in your time of need, loving tribute, final farewell, laid to rest, personalized service, dedicated staff, caring team, honor their memory, devoted to serving families, quality care, family-owned tradition, serving families since, committed to excellence, gone but not forgotten, rest in peace, grief journey, healing process, closure, moving forward, beautiful service, seamless experience, peace of mind, meaningful goodbye, forever in our hearts, affordable options (be specific instead), value-added, profound loss, celebrate a life.




REPLACEMENT RULES:
- "Loved one" → use "your dad," "your mom," "your husband," "your wife," "the person who died"
- "Passing" / "passed away" → "died," "when they die," "after death"
- "At this difficult time" → describe the actual situation specifically
- If it sounds like it belongs on a funeral home lobby wall — rewrite it.`;




// ─── AUDIENCE FRAMING ─────────────────────────────────────────────────────────
const AUDIENCE = `WHO IS WATCHING:
This person is NOT in crisis. NOT at an arrangement conference. They are 45-65 years old, scrolling social media on a weekday evening. Their parents are aging or recently died. They are starting to think about arrangements but haven't called anyone yet. They have questions they're embarrassed to Google. They stopped because the hook surprised them or told them something they didn't know. Write for curious, not grieving.`;




// ─── BUSINESS TYPE CONTEXTS ───────────────────────────────────────────────────
const BIZ_CONTEXT: Record<string, string> = {
  "funeral-home": `BUSINESS: Funeral Home Director




You have seen families walk in completely unprepared. You know things families don't:
- The person holding power of attorney loses ALL legal authority the moment the person dies. A completely different chain of decision-making rights kicks in immediately. Most families have no idea this happens.
- Embalming is NOT legally required in most states. Refrigeration is an alternative. Funeral homes don't always volunteer this information.
- A pre-arrangement at one funeral home CAN be transferred to a different funeral home. Most families and most directors never bring this up.
- Families choose competitors not because the competitor is better — but because the competitor is more known, offered a lower price, had served the family before, or holds a pre-arrangement the family didn't know they could transfer.
- In the casket selection room, families often overspend because they equate price with love. This is not an accident of design.
- "Direct cremation" does not mean no service. A memorial can happen after, once the family has the remains.
- The thumbprint is taken before cremation for identification. When explained, families find this meaningful — not morbid.
- You lose cases to competitors for four reasons: competitor was more known, had a lower price, had served the family before, or held a pre-arrangement the family didn't know was transferable.`,




  "cemetery": `BUSINESS: Cemetery Owner / Manager




You are invisible to most families until they need you — which means by the time someone talks to you, a person has just died and the family is in shock making decisions under pressure. Your entire content opportunity is reaching families BEFORE that moment.




Things you know that families don't:
- "Perpetual care" does not mean the grave is maintained to any specific standard forever. It means a fund exists for general cemetery upkeep. Most families assume it means far more than it does.
- A cemetery lot has a deed. It is real property that can often be resold, transferred to a family member, or returned to the cemetery for a partial refund.
- Buying a lot in advance locks today's price. Cemetery prices typically increase. This is a real financial argument families never hear until it's too late.
- Veteran burial benefits are significantly underutilized. Families don't know how to apply, what's covered, or that it must be applied for — it is not automatic.
- Green burial sections now exist inside many traditional cemeteries, not only specialty grounds.
- Ground burial plots, mausoleum spaces, cremation niches, and columbarium niches all have different cost, maintenance, and access implications that families almost never understand until they're making the decision in grief.`,




  "crematory": `BUSINESS: Crematory Operator




You work in the fastest-growing and most misunderstood segment of death care. Families think cremation is simple. They don't understand the process, the timeline, or the options.




Things you know that families don't:
- Flame cremation takes 2–3 hours at 1,400–1,800 degrees Fahrenheit. It is a controlled industrial process — not "burning" in the way most people imagine.
- Aquamation (water cremation / alkaline hydrolysis) uses heated water and an alkali solution. Takes 12–18 hours. Produces approximately 20% more remains than flame cremation. The remains are finer and whiter.
- A stainless steel ID tag travels with the body through the ENTIRE process — from arrival through the return of remains to the family. This is how identification is guaranteed. Not a tracking number. A physical tag.
- The "ashes" families receive are NOT ash. They are pulverized bone fragments — white/gray, heavier than people expect.
- Individual cremation = one person only in the chamber. Family receives only their family member's remains.
- Communal cremation = multiple people together. Families do not receive individual remains. This distinction is not always made clear at the time of arrangement.
- "Direct cremation" means no embalming, no formal viewing before cremation. A memorial can absolutely still happen after.`,




  "pet-cremation": `BUSINESS: Pet Cremation Business




Your clients just lost a family member — one who happened to have four legs. The grief is real. The guilt is real. Many people feel embarrassed about how deeply they're grieving.




Things you know that families don't:
- The grief of losing a pet is neurologically and psychologically identical to losing a human family member. It is not smaller grief. The brain processes it the same way. When someone says "I can't believe how hard I'm taking this" — they are having a normal response.
- Individual cremation = one animal only in the chamber. Family receives only their pet's remains.
- Communal cremation = multiple animals together. Families do not receive individual remains, or receive a portion of mixed remains. This difference is not always clearly explained when families are making decisions under emotional duress.
- An ID tag travels with the animal through the entire process — this is the guarantee of identity.
- The remains are bone fragments. White or off-white. Heavier than expected. Telling families this in advance is a kindness, not a burden.
- The grief is often compounded by the fact that the owner had to make the decision to end their pet's life. That guilt layer deserves to be named and addressed, not avoided.
- Most people don't know their full range of options: scattering, burial, keeping, dividing into keepsake jewelry, memorial trees. None of these is wrong.`
};




// ─── CONTENT CATEGORY CONTEXT ─────────────────────────────────────────────────
const CAT_CONTEXT: Record<string, string> = {
  "demystify": `CONTENT ANGLE: Process & Demystification
Pull back the curtain on what actually happens. Answer what families are afraid to Google. Be specific — real steps, real tools, real timeframes. Specific information reduces fear. Vague descriptions increase it. Do not soften the reality. Do not be squeamish. The funeral director who answers these questions publicly becomes the trusted expert before anyone walks through the door.`,




  "value": `CONTENT ANGLE: Value & Price Transparency
Address the price conversation from a position of confidence, not defensiveness. Not "we're worth it" — but "here's exactly what you're getting and here's what you give up by going cheaper." Help families understand what they're actually paying for. This director is not embarrassed about pricing. They understand that the family who chooses a discounted option and later regrets it carries that forever. Be specific about what's included, what's excluded, what costs more and why.`,




  "legal": `CONTENT ANGLE: Legal & Decision Clarity
Answer the legal questions families don't know to ask until it's too late — and by then they're standing in an arrangement room in shock. Who has the legal right to make decisions after someone dies. What happens to power of attorney the moment of death (it ends, completely, immediately). The two types of organ donation. What a pre-arrangement legally means. Why a thumbprint is taken. These questions cause real family conflict. Answer them before the moment of need.`,




  "preplanning": `CONTENT ANGLE: Pre-Planning & Pre-Need
Frame pre-planning as a gift to the family left behind — not a morbid task for yourself. Cover: the difference between pre-planning (documenting wishes) and pre-paying (two different things), how to transfer a pre-arrangement to a different funeral home, what happens to pre-paid funds if the funeral home closes, how to start the conversation with aging parents. Give one concrete next step. Make it feel manageable, not overwhelming.`,




  "mythbust": `CONTENT ANGLE: Myth Busting
State the myth-bust in the FIRST SENTENCE. Not "did you know?" — state the fact directly. "You don't have to be embalmed." "Caskets don't have to be purchased from the funeral home — federal law says so." "Your power of attorney ends the moment they die." "You can transfer your pre-arrangement." Pattern interrupt is the mechanism. The viewer thinks they know something. The first line tells them they don't. They have to keep watching.`
};




// ─── PLATFORM CONTEXT ─────────────────────────────────────────────────────────
const PLATFORM_CONTEXT: Record<string, string> = {
  "facebook": `PLATFORM: Facebook. Audience 50-70. Storytelling works — "I had a family come in last week who had no idea that..." Write like a knowledgeable neighbor talking to a neighbor, not a service provider. Community connection matters. A direct question to the viewer at the end ("Has your family had this conversation yet?") drives comments better than a hard sell.`,




  "reels": `PLATFORM: Instagram Reels / TikTok. Audience 38-55. The first sentence is everything. No setup. No intro. No "hey." The most surprising or most important thing comes FIRST — immediately. Short sentences. Fast pace. End with a specific action: "Save this for your family" or "DM me the word PLAN" outperform generic CTAs significantly.`,




  "youtube": `PLATFORM: YouTube Shorts. Audience 42-65. Slightly more educational tolerance. "The real answer to..." or "What most people don't know about..." work as openers. Still start strong — most interesting thing first. One clear ask at the end.`
};




// ─── TONE CONTEXT ─────────────────────────────────────────────────────────────
const TONE_CONTEXT: Record<string, string> = {
  "straight-shooter": "TONE: Direct. Confident. No fluff. Says the real thing plainly. Doesn't soften it.",
  "myth-buster": "TONE: Provocative. Challenges what they think they know. Bold opener. Creates a pattern interrupt.",
  "insider": "TONE: Expert letting them in on something. Shares what most funeral directors won't say publicly.",
  "neighbor": "TONE: Warm but real. Talks like a knowledgeable person having a genuine conversation — not a professional delivering a presentation.",
  "compassionate-educator": "TONE: Warm, educational, and caring. Speak like a funeral director who genuinely wants families to understand their options. Informative but human.",
  "industry-insider": "TONE: Confident and authoritative. Share insider knowledge with a 'let me tell you what most people don't know' energy. Direct.",
  "myth-buster-legacy": "TONE: Bold, slightly provocative. Challenge misconceptions. 'Did you know?' energy — surprising and engaging.",
  "comforting-guide": "TONE: Soft, supportive. Like a trusted friend helping someone through something difficult while giving them real information."
};




// ─── VOICE PROFILE BUILDER (preserved from original) ──────────────────────────
function buildVoicePrompt(vp: any): string {
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




// ─── HANDLER ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });




  try {
    const {
      idea,
      tone = "straight-shooter",
      bizType = "funeral-home",
      category = "demystify",
      platform = "facebook",
      userId
    } = await req.json();




    if (!idea) {
      return new Response(
        JSON.stringify({ success: false, error: 'idea is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    let voiceProfilePrompt = '';
    if (userId && tone === 'my-voice') {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: vp } = await supabase.from('voice_profiles').select('*').eq('user_id', userId).maybeSingle();
        if (vp) voiceProfilePrompt = buildVoicePrompt(vp);
      } catch (e) {
        console.error('Failed to fetch voice profile:', e);
      }
    }




    const bizLabel = {
      "funeral-home": "Funeral Home",
      "cemetery": "Cemetery",
      "crematory": "Crematory",
      "pet-cremation": "Pet Cremation Business"
    }[bizType] || "Funeral Home";




    const toneGuide = (tone === 'my-voice' && voiceProfilePrompt)
      ? voiceProfilePrompt
      : TONE_CONTEXT[tone] || TONE_CONTEXT["straight-shooter"];




    const systemPrompt = [
      `You write 45-second teleprompter-ready video scripts for ${bizLabel}s to post on social media.`,
      `The script is written FROM the funeral professional's perspective — they are speaking on camera as the expert.`,
      AUDIENCE,
      BIZ_CONTEXT[bizType] || BIZ_CONTEXT["funeral-home"],
      CAT_CONTEXT[category] || CAT_CONTEXT["demystify"],
      PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT["facebook"],
      toneGuide,
      FORBIDDEN,
      `SCRIPT FORMAT:
HOOK (first 1-3 sentences): Most interesting thing first. No setup. No intro. No "hey guys." Must earn the next 40 seconds on its own.
BODY: Natural spoken language — not prose, not a brochure. Short sentences. [PAUSE] markers where the speaker breathes or lets a point land. Specific details, real numbers, real timeframes. Vague claims are invisible. Specifics get shared.
CTA: One real, specific ask. NOT "like and subscribe." Something that creates genuine connection: "Drop your question below," "DM me the word PLAN," "Save this — your family needs to see it."




LENGTH: Under 120 words total (45 seconds spoken aloud).
NO emojis in the script.
NO jargon without immediate plain-language explanation.
If it sounds like it was written by a marketing committee — rewrite it.`
    ].join('\n\n');




    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Write a 45-second script for a ${bizLabel} about: "${idea}"




Return ONLY valid JSON, no markdown, no code fences:
{"hook":"opening hook lines","body":"main content with [PAUSE] markers","cta":"closing call to action","wordCount":95}`
          }
        ],
        temperature: 0.82,
        max_tokens: 600,
      }),
    });




    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ success: false, error: 'Rate limit — try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }




    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';




    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }




    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );




  } catch (error) {
    console.error('Error generating script:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
