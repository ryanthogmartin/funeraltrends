const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword } = await req.json();

    if (!keyword || typeof keyword !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'keyword string is required' }),
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
            content: 'You generate short-form video content ideas (TikTok/Reels/Shorts) for funeral directors to post on their social media. Every idea must be written FROM the funeral director\'s perspective — they are the creator, the expert, the one speaking on camera. Topics should position the funeral director as an authority, educator, or relatable professional. Never write ideas from the consumer or grieving family perspective. Return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: `Generate exactly 25 unique short-form video content ideas for a funeral director to film about the keyword "${keyword}". Each idea should be a catchy, engaging title under 80 characters suitable for TikTok/Reels/Shorts. Write from the funeral director's voice and perspective. Cover different angles: behind-the-scenes, myth-busting, educational tips, day-in-the-life, "things I wish families knew", industry insider knowledge, Q&A, storytelling.

Return JSON in this exact format:
${JSON.stringify({ keyword: "example", ideas: ["idea1", "idea2"] })}`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000,
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
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating watchlist topics:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
