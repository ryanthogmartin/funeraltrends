import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildIdeaVoicePrompt } from "../_shared/idea-voice.ts";
import { buildIdeaSystemPrompt, buildIdeaUserMessage } from "../_shared/idea-prompt.ts";
import { buildTabooBlock } from "../_shared/content-context.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Requests exceeding this many calls in the current UTC hour, per user,
// are rejected with 429 before any AI spend happens.
const RATE_LIMIT_PER_HOUR = 30;




// ─── HANDLER ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });




  try {
    // ── Identity: derive the caller from their verified JWT. `verify_jwt =
    // true` in config.toml already rejects requests with no/invalid token
    // before this code runs; we resolve the user here so we can rate-limit
    // per-user rather than globally.
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      topic,
      inputMode = "keyword",
      bizType = "funeral-home",
      category = "demystify",
      platform = "facebook",
      tone = "straight-shooter",
      keywords,
      previousIdeas
    } = await req.json();

    // Titles already shown to this user for this topic (client-supplied on
    // regenerate). Cap the list so a long session can't bloat the prompt.
    const priorTitles: string[] = Array.isArray(previousIdeas)
      ? previousIdeas.filter((t: unknown) => typeof t === 'string' && t.trim()).slice(-24)
      : [];




    const activeTopic = topic || (Array.isArray(keywords) ? keywords[0] : null);




    if (!activeTopic) {
      return new Response(
        JSON.stringify({ success: false, error: 'topic is required' }),
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
    // continues) if the rate-limit table/RPC itself errors.
    try {
      const windowStart = new Date();
      windowStart.setUTCMinutes(0, 0, 0);
      const { data: callCount, error: rateError } = await supabase.rpc('increment_function_rate_limit', {
        p_user_id: userId,
        p_function_name: 'generate-video-topics',
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




    // Business identity (mirrors generate-script): so a menu of ideas is
    // specific to THIS business rather than generic to the profession, and two
    // businesses on the same topic don't get the same eight titles. Applied to
    // EVERY tone, including my-voice — full persona voice on idea titles is a
    // separate, still-undecided change.
    //
    // Deliberate deviation from generate-script: `signature_opening` is NOT
    // included here. In a script it seeds one hook; in a menu it would tend to
    // prefix all eight titles with the same phrase.
    let businessIdentityPrompt = '';
    let ideaVoicePrompt = '';
    let tabooPrompt = '';
    try {
      const { data: vp } = await supabase.from('voice_profiles').select('*').eq('user_id', userId).maybeSingle();
      if (vp) {
        // Applies on EVERY tone. Unlike signature_opening (held back below
        // because it would prefix all eight titles), a prohibition has no
        // downside on a menu — it was simply missed, and idea titles honored
        // no taboo list at all until now.
        tabooPrompt = buildTabooBlock(vp.taboo_topics);
        const bits: string[] = [];
        if (vp.funeral_home_name) bits.push(`- The speaker works at ${vp.funeral_home_name}. Where an idea naturally calls for it, ground it in that business — not as an ad, and not in every title.`);
        if (vp.specialties) bits.push(`- Their specialties: ${vp.specialties}. Prefer angles that draw on these where the topic allows.`);
        if (bits.length) {
          businessIdentityPrompt = `BUSINESS IDENTITY — make these ideas specific to THIS business, not generic to the profession:\n${bits.join('\n')}`;
        }
        // "My Voice" additionally gets the narrowed persona block: vocabulary,
        // audience address, and world — not catchphrases, signature opening,
        // or dialect. Those remain script-only (see _shared/idea-voice.ts).
        if (tone === 'my-voice') {
          ideaVoicePrompt = buildIdeaVoicePrompt(vp);
        }
      }
    } catch (e) {
      console.error('Failed to fetch voice profile:', e);
    }




    // Prompt assembly lives in _shared/idea-prompt.ts so tests import the exact
    // builder production uses. Do NOT reconstruct a prompt inline here — a
    // hand-mirrored copy in a harness is what let STANCE/INTEGRITY go missing
    // from this function undetected for four rounds.
    const systemPrompt = buildIdeaSystemPrompt({
      bizType, category, platform, tone,
      businessIdentityPrompt,
      ideaVoicePrompt,
      tabooPrompt,
    });

    const userMessage = buildIdeaUserMessage({
      inputMode, activeTopic, bizType, priorTitles,
    });




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
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
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
    // On claude-sonnet-5 a thinking block precedes the text block.
    const content = data.content?.find((b: any) => b.type === 'text')?.text || '';




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
        ideas: parsed.ideas || [],
        data: [{ keyword: activeTopic, ideas: parsed.ideas || [] }]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );




  } catch (error) {
    console.error('Error generating video topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
