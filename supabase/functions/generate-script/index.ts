import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { FORBIDDEN, AUDIENCE, BIZ_CONTEXT, CAT_CONTEXT, PLATFORM_CONTEXT } from "../_shared/content-context.ts";




const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Requests exceeding this many calls in the current UTC hour, per user,
// are rejected with 429 before any AI spend happens.
const RATE_LIMIT_PER_HOUR = 30;




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
    // ── Identity: derive the caller from their verified JWT, never from the
    // request body. `verify_jwt = true` in config.toml already rejects
    // requests with no/invalid token before this code runs, but we still
    // resolve the user here so we know *who* is calling.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const userId = user.id;

    // Service-role client for DB access (voice profile lookup, rate limits).
    // Only ever keyed off `userId` above — never a client-supplied value.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      idea,
      tone = "straight-shooter",
      bizType = "funeral-home",
      category = "demystify",
      platform = "facebook",
    } = await req.json();




    if (!idea) {
      return new Response(
        JSON.stringify({ success: false, error: 'idea is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    // ── Rate limit: cap AI spend per user per hour. Fails open (logs and
    // continues) if the rate-limit table/RPC itself errors, so a DB hiccup
    // never blocks a legitimate generation.
    try {
      const windowStart = new Date();
      windowStart.setUTCMinutes(0, 0, 0);
      const { data: callCount, error: rateError } = await supabase.rpc('increment_function_rate_limit', {
        p_user_id: userId,
        p_function_name: 'generate-script',
        p_window_start: windowStart.toISOString(),
      });
      if (rateError) {
        console.error('Rate limit check failed:', rateError);
      } else if (typeof callCount === 'number' && callCount > RATE_LIMIT_PER_HOUR) {
        return new Response(
          JSON.stringify({ success: false, error: 'Hourly generation limit reached. Try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('Rate limit check threw:', e);
    }




    let voiceProfilePrompt = '';
    if (tone === 'my-voice') {
      try {
        const { data: vp } = await supabase.from('voice_profiles').select('*').eq('user_id', userId).maybeSingle();
        if (vp) voiceProfilePrompt = buildVoicePrompt(vp);
      } catch (e) {
        console.error('Failed to fetch voice profile:', e);
      }
    }




    const bizLabel = ({
      "funeral-home": "Funeral Home",
      "cemetery": "Cemetery",
      "crematory": "Crematory",
      "pet-cremation": "Pet Cremation Business"
    } as Record<string, string>)[bizType] || "Funeral Home";




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




    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Write a 45-second script for a ${bizLabel} about: "${idea}"




CRITICAL REQUIREMENTS:
1. The HOOK must be the single most surprising or specific thing about this topic — no scene-setting, no setup, straight to the point.
2. The BODY must use real, specific details. No vague statements.
3. The CTA is REQUIRED — end with one specific action for the viewer to take.
4. CHECK YOUR GRAMMAR before returning. Every sentence must be grammatically correct.
5. Also write TWO ALTERNATE HOOKS that open the same script a different way — a different angle, not a reworded version of the first. Each alternate must work as the opening line of the same body.

Return ONLY valid JSON, no markdown, no code fences:
{"hook":"opening hook lines","hookVariants":["alternate hook 1","alternate hook 2"],"body":"main content with [PAUSE] markers","cta":"closing call to action","wordCount":95}`
          }
        ],
        temperature: 0.82,
        max_tokens: 800,
      }),
    });




    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ success: false, error: 'Rate limit — try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }




    const data = await response.json();
    // Anthropic Messages API shape: content is an array of blocks; the
    // generated text lives in the first text block.
    const content = data.content?.[0]?.text || '';




    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }




    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...parsed,
          hookVariants: Array.isArray(parsed.hookVariants) ? parsed.hookVariants.filter((h: unknown) => typeof h === 'string' && h.trim()) : [],
        },
      }),
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
