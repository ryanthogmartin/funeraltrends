import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { FORBIDDEN, AUDIENCE, BIZ_CONTEXT, CAT_CONTEXT, PLATFORM_CONTEXT } from "../_shared/content-context.ts";

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
      keywords
    } = await req.json();




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




    const bizLabel = ({
      "funeral-home": "Funeral Home",
      "cemetery": "Cemetery",
      "crematory": "Crematory",
      "pet-cremation": "Pet Cremation Business"
    } as Record<string, string>)[bizType] || "Funeral Home";




    const toneLabels: Record<string, string> = {
      "straight-shooter": "Direct. Confident. Says the real thing plainly.",
      "myth-buster": "Provocative. Challenges what they think they know. Bold opener.",
      "insider": "Shares what most funeral directors won't say publicly.",
      "neighbor": "Warm but real. Knowledgeable person talking, not a professional presenting."
    };




    const systemPrompt = [
      `You generate short-form video ideas for ${bizLabel}s to post on social media.`,
      `Each idea is a video TITLE that doubles as the opening hook — it must be compelling enough to stop someone scrolling on its own.`,
      AUDIENCE,
      BIZ_CONTEXT[bizType] || BIZ_CONTEXT["funeral-home"],
      CAT_CONTEXT[category] || CAT_CONTEXT["demystify"],
      PLATFORM_CONTEXT[platform] || PLATFORM_CONTEXT["facebook"],
      `TONE: ${toneLabels[tone] || toneLabels["straight-shooter"]}`,
      FORBIDDEN,
      `RULES FOR IDEAS:
- Statements or reveals — NOT questions
- Use real words (die, death, cost, body) — not euphemisms
- Specific beats vague every time: "The 4 documents you need within 48 hours of a death" beats "What to do when someone dies"
- Each idea should be something the viewer couldn't have Googled to find at the top of results — insider knowledge, unexpected angles, things the industry usually avoids saying publicly
- If it sounds like generic AI content — make it more specific to the ${bizLabel} industry`,
      `Return ONLY valid JSON, no markdown: {"ideas":["idea 1","idea 2","idea 3","idea 4","idea 5","idea 6","idea 7","idea 8"]}`
    ].join('\n\n');




    const userMessages: Record<string, string> = {
      "keyword": `Generate 8 video ideas for a ${bizLabel} about the topic: "${activeTopic}"`,
      "question": `A family keeps asking this question: "${activeTopic}" — Generate 8 different video angles a ${bizLabel} could make to answer this, each with a different hook or approach.`,
      "free": `Generate 8 video ideas for a ${bizLabel} about: "${activeTopic}"`
    };




    const userMessage = userMessages[inputMode] || userMessages["keyword"];




    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
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
