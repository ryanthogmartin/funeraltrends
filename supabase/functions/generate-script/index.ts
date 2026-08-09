import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  buildScriptSystemPrompt,
  buildScriptUserMessage,
  buildAvoidInstruction,
  buildVoicePrompt,
} from "../_shared/script-prompt.ts";
import { bizLabelFor } from "../_shared/content-context.ts";




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




// TONE_CONTEXT and buildVoicePrompt now live in _shared/script-prompt.ts.




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




    const bizLabel = bizLabelFor(bizType);




    // Prompt assembly lives in _shared/script-prompt.ts so tests import the
    // exact builder production uses. Do NOT reconstruct a prompt inline here —
    // a hand-mirrored copy in a harness is what let STANCE/INTEGRITY go missing
    // from generate-video-topics undetected for four rounds.
    const systemPrompt = buildScriptSystemPrompt({
      bizType, category, platform, tone,
      voiceProfilePrompt,
      businessIdentityPrompt,
    });




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
              content: buildScriptUserMessage({ bizType, idea, avoidInstruction }),
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
      const retry = await generateOnce(buildAvoidInstruction(parsed.hook));
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
