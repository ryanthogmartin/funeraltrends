import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { FORBIDDEN, AUDIENCE, BIZ_CONTEXT, CAT_CONTEXT, PLATFORM_CONTEXT, STANCE, INTEGRITY, EXEMPLARS } from "../_shared/content-context.ts";




const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Requests exceeding this many calls in the current UTC hour, per user,
// are rejected with 429 before any AI spend happens.
const RATE_LIMIT_PER_HOUR = 30;

// ─── ANTI-REPETITION (Task 5) ─────────────────────────────────────────────────
// Word-trigram Jaccard similarity at/above this vs any of the user's recent
// generations triggers one regeneration with an explicit "different angle"
// instruction; if still similar, the response carries similarityWarning: true.
const SIMILARITY_THRESHOLD = 0.6;
// How many of the user's most recent fingerprints to compare against.
const FINGERPRINT_LOOKBACK = 30;

function normalizeForFingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/\[pause\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function trigramSet(normalized: string): Set<string> {
  const words = normalized.split(' ').filter(Boolean);
  const grams = new Set<string>();
  if (words.length < 3) {
    if (normalized) grams.add(normalized);
    return grams;
  }
  for (let i = 0; i <= words.length - 3; i++) {
    grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const g of a) if (b.has(g)) intersection++;
  return intersection / (a.size + b.size - intersection);
}




// ─── TONE CONTEXT ─────────────────────────────────────────────────────────────
// The UI offers only the warm lineup (compassionate-educator, neighbor,
// comforting-guide, plus the My Voice persona path). The remaining keys are
// retained as ALIASES, not dead code: `saved_ideas.script_tone` persists a
// tone per saved script, so a previously-generated script can still send
// `straight-shooter` / `insider` / `industry-insider` / `myth-buster` /
// `myth-buster-legacy` on regenerate. Removing them would fall back to the
// default voice silently. Keep unless that persistence goes away.
const TONE_CONTEXT: Record<string, string> = {
  "straight-shooter": "TONE: Direct, confident, plain-spoken. Says the real thing clearly and kindly. Direct is not cold.",
  "myth-buster": "TONE: Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
  "insider": "TONE: A generous expert sharing what families wish they'd known sooner — knowledgeable and open, never 'exposing' the industry.",
  "neighbor": "TONE: Warm but real. Talks like a knowledgeable person having a genuine conversation — not a professional delivering a presentation.",
  "compassionate-educator": "TONE: Warm, educational, and caring. Speak like a funeral director who genuinely wants families to understand their options. Informative but human.",
  "industry-insider": "TONE: Confident and knowledgeable. Shares real expertise plainly, the way a seasoned professional educates — direct, never conspiratorial.",
  "myth-buster-legacy": "TONE: Clears up a common misconception with a clear, confident opener — corrects gently, never confronts.",
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




    // Voice profile is now fetched for EVERY tone (Task 5, cross-tenant
    // differentiation): "My Voice" gets the full persona prompt as before,
    // while every other tone gets a light business-identity block (name,
    // specialties, signature opening) so two businesses using the same tone
    // on the same topic don't produce word-for-word-similar scripts.
    let voiceProfilePrompt = '';
    let businessIdentityPrompt = '';
    try {
      const { data: vp } = await supabase.from('voice_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (vp) {
        if (tone === 'my-voice') {
          voiceProfilePrompt = buildVoicePrompt(vp);
        } else {
          const bits: string[] = [];
          if (vp.funeral_home_name) bits.push(`- The speaker works at ${vp.funeral_home_name}. Mention the business naturally where it fits (once, not as an ad).`);
          if (vp.specialties) bits.push(`- Their specialties: ${vp.specialties}. Lean on these where relevant to the topic.`);
          if (vp.signature_opening?.trim()) bits.push(`- If it fits the hook, they often open with: "${vp.signature_opening}"`);
          if (bits.length) {
            businessIdentityPrompt = `BUSINESS IDENTITY — make this script specific to THIS business, not generic to the industry:\n${bits.join('\n')}`;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch voice profile:', e);
    }

    // Recent fingerprints for this account, used to detect near-duplicates.
    let recentFingerprints: { normalized_text: string }[] = [];
    try {
      const { data: fps } = await supabase
        .from('script_fingerprints')
        .select('normalized_text')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(FINGERPRINT_LOOKBACK);
      recentFingerprints = fps ?? [];
    } catch (e) {
      console.error('Failed to fetch fingerprints:', e);
    }




    const bizLabel = ({
      "funeral-home": "Funeral Home",
      "cemetery": "Cemetery",
      "crematory": "Crematory",
      "pet-cremation": "Pet Cremation Business"
    } as Record<string, string>)[bizType] || "Funeral Home";




    const toneGuide = (tone === 'my-voice' && voiceProfilePrompt)
      ? voiceProfilePrompt
      : TONE_CONTEXT[tone] || TONE_CONTEXT["compassionate-educator"];




    const systemPrompt = [
      `You write 45-second teleprompter-ready video scripts for ${bizLabel}s to post on social media.`,
      `The script is written FROM the funeral professional's perspective — they are speaking on camera as the expert.`,
      AUDIENCE,
      STANCE,
      BIZ_CONTEXT[bizType] || BIZ_CONTEXT["funeral-home"],
      INTEGRITY,
      CAT_CONTEXT[category] || CAT_CONTEXT["demystify"],
      PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT["facebook"],
      toneGuide,
      businessIdentityPrompt,
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




    // One model call. `avoidInstruction` is appended on the anti-repetition
    // retry to force a different angle.
    const generateOnce = async (avoidInstruction: string): Promise<{ ok: true; parsed: any } | { ok: false; resp: Response }> => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          thinking: { type: 'disabled' },
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Write a 45-second script for a ${bizLabel} about: "${idea}"




CRITICAL REQUIREMENTS:
1. The HOOK must be the most RESONANT thing about this topic — the real question families are afraid to ask, or the reassurance they most need. Straight in, no scene-setting. Surprising is fine; a gotcha or "they don't want you to know" angle is not.
2. The BODY must be concrete and specific in LANGUAGE, but must NOT state any price, number, temperature, or timeline that isn't provided — use a [placeholder] instead. Concrete does not mean invented.
3. The CTA is REQUIRED — end with one specific action for the viewer to take.
4. CHECK YOUR GRAMMAR before returning. Every sentence must be grammatically correct.
5. Also write TWO ALTERNATE HOOKS that open the same script a different way — a different angle, not a reworded version of the first. Each alternate must work as the opening line of the same body.${avoidInstruction}

Return ONLY valid JSON, no markdown, no code fences:
{"hook":"opening hook lines","hookVariants":["alternate hook 1","alternate hook 2"],"body":"main content with [PAUSE] markers","cta":"closing call to action","wordCount":95}`
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', response.status, errText);
        if (response.status === 429) return { ok: false, resp: new Response(JSON.stringify({ success: false, error: 'Rate limit — try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
        if (response.status === 402) return { ok: false, resp: new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
        return { ok: false, resp: new Response(JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
      }

      const data = await response.json();
      // Anthropic Messages API shape: content is an array of blocks. On
      // claude-sonnet-5, adaptive thinking is on by default, so a thinking
      // block precedes the text block — find the text block, don't index [0].
      const content = data.content?.find((b: any) => b.type === 'text')?.text || '';

      try {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return { ok: true, parsed: JSON.parse(cleaned) };
      } catch {
        console.error('Failed to parse AI response:', content);
        return { ok: false, resp: new Response(JSON.stringify({ success: false, error: 'Failed to parse AI response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
      }
    };

    const fingerprintOf = (p: any) => normalizeForFingerprint(`${p?.hook || ''} ${p?.body || ''}`);
    const maxSimilarity = (normalized: string) => {
      const grams = trigramSet(normalized);
      let max = 0;
      for (const fp of recentFingerprints) {
        max = Math.max(max, jaccard(grams, trigramSet(fp.normalized_text)));
      }
      return max;
    };

    const first = await generateOnce('');
    if (!first.ok) return first.resp;
    let parsed = first.parsed;
    let similarity = maxSimilarity(fingerprintOf(parsed));

    // Near-duplicate of something this account already generated: retry once
    // with an explicit instruction to take a different angle. Keep whichever
    // attempt is less similar to the account's history.
    if (similarity >= SIMILARITY_THRESHOLD) {
      const retry = await generateOnce(`
6. IMPORTANT — ANTI-REPETITION: This account has already received a very similar script on this topic. Take a genuinely DIFFERENT angle: a different insider fact for the hook, a different structure, different specifics. Do NOT reuse or lightly reword this previous opening: "${String(parsed.hook || '').slice(0, 160)}"`);
      if (retry.ok) {
        const retrySimilarity = maxSimilarity(fingerprintOf(retry.parsed));
        if (retrySimilarity < similarity) {
          parsed = retry.parsed;
          similarity = retrySimilarity;
        }
      }
    }
    // Still too similar after the retry: return it, but tell the frontend so
    // it can surface "this is close to a script you already have" to the user
    // instead of silently handing over a near-duplicate.
    const similarityWarning = similarity >= SIMILARITY_THRESHOLD;

    // Record this generation's fingerprint (fail-open — a fingerprint write
    // failure should never block returning the script).
    try {
      const normalized = fingerprintOf(parsed);
      if (normalized) {
        await supabase.from('script_fingerprints').insert({
          user_id: userId,
          content_hash: await sha256Hex(normalized),
          normalized_text: normalized,
          idea_text: String(idea).slice(0, 500),
          tone,
          biz_type: bizType,
        });
      }
    } catch (e) {
      console.error('Failed to store fingerprint:', e);
    }

    // The model's self-reported wordCount is unreliable (observed: reported 118
    // for a 129-word body), and the UI displays it as fact. Recompute from the
    // text we actually return and overwrite — the server value wins.
    //
    // Counts the BODY only, matching what the saved-script PDF counts. [PAUSE]
    // markers are stage directions, not spoken words, so they're excluded —
    // this number is meant to answer "how long is this to read aloud".
    const spokenBody = String(parsed.body || '').replace(/\[PAUSE\]/gi, ' ');
    const trueWordCount = spokenBody.trim().split(/\s+/).filter(Boolean).length;

    return new Response(
      JSON.stringify({
        success: true,
        similarityWarning,
        data: {
          ...parsed,
          wordCount: trueWordCount,
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
