const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Keywords array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an Instagram social media expert specializing in the funeral and death care industry.

Given these trending funeral keywords: ${keywords.join(', ')}

Generate a JSON array of 15 trending Instagram hashtags related to funeral/death care. For each hashtag, provide:
- "hashtag": the hashtag (with #, lowercase, no spaces)
- "posts": estimated total posts using this hashtag as a string like "1.2M" or "85K"
- "growth": percentage growth trend (number, can be negative)
- "category": one of "trending", "evergreen", "emerging"
- "relatedKeyword": which input keyword it relates to most

Mix realistic popular Instagram hashtags (#funeralhome, #celebrationoflife, #greenburial, #memorialservice) with niche emerging ones.
Make post counts realistic for funeral niche on Instagram. Instagram hashtags tend to have higher post counts than TikTok views.

Return ONLY a valid JSON array, no markdown.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || '';

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse hashtag data from AI');
    }

    const hashtags = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ success: true, data: hashtags }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating Instagram hashtags:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
