const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) throw new Error('PERPLEXITY_API_KEY not configured');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a social media analyst specializing in the funeral and death care industry on Instagram. Return ONLY a valid JSON array, no markdown, no code fences.'
          },
          {
            role: 'user',
            content: `Search for the latest trending Instagram Reels topics related to the funeral profession, death care, grief support, and funeral homes. Look for viral Reels formats, trending audio usage, and popular content themes funeral directors and morticians are using on Instagram right now.

Return a JSON array of 8-10 objects with:
- "topic": The trending Reels topic or format (string)
- "context": Brief description of why it's trending or what makes it work (string)
- "source": Where this was found, e.g. "Funeral Director Reels", "Mortician Creators", "Grief Community" (string)
- "viralPotential": Estimated viral potential - "high", "medium", or "low" (string)
- "contentAngle": A suggested angle a funeral home could use to create this type of Reel (string)

Return ONLY the JSON array.`
          }
        ],
        search_recency_filter: 'week',
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error('Perplexity error:', response.status, t);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    const citations = data.citations || [];

    let trends;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      trends = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse Perplexity response:', content);
      throw new Error('Failed to parse response');
    }

    return new Response(
      JSON.stringify({ success: true, data: trends, citations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching Reels trends:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
