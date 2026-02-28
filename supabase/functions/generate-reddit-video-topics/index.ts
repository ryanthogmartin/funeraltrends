const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { posts } = await req.json();

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'posts array is required' }),
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

    const top5 = posts.slice(0, 5);
    const postDescriptions = top5.map((p: { title: string; subreddit: string }, i: number) =>
      `${i + 1}. "${p.title}" (r/${p.subreddit})`
    ).join('\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: 'You generate short-form video content ideas (TikTok/Reels/Shorts) inspired by Reddit discussions about the funeral industry. Return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: `Based on these 5 trending Reddit discussions about funerals, suggest exactly 3 short-form video content ideas for each. Each idea should be a catchy, engaging title under 80 characters suitable for TikTok/Reels/Shorts.

Reddit posts:
${postDescriptions}

Return JSON in this exact format:
${JSON.stringify({ topics: [{ post_title: "example post", ideas: ["idea1", "idea2", "idea3"] }] })}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed.topics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating reddit video topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
