const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, summary, relatedKeywords } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Trend title is required' }),
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

    const keywords = (relatedKeywords || []).join(', ');

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
            content: `You generate short-form video content ideas (TikTok/Reels/Shorts) for US funeral directors. Every idea must be from the funeral director's perspective — they are the creator, expert, speaking on camera. For each idea, also write a complete 45-second script with a hook, body, and call-to-action. Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Based on this trending topic in the US funeral industry:

Title: "${title}"
Context: "${summary || ''}"
Related keywords: ${keywords}

Generate exactly 5 short-form video ideas that a funeral director could film about this trend. For each idea, include a full 45-second script.

Return JSON in this exact format:
{
  "ideas": [
    {
      "title": "Catchy video title under 80 chars",
      "hook": "Opening hook line (first 3 seconds to grab attention)",
      "body": "Main script body (30-35 seconds of content)",
      "cta": "Call to action (final 5-7 seconds)",
      "wordCount": 120
    }
  ]
}`,
          },
        ],
        temperature: 0.8,
        max_tokens: 3000,
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
      JSON.stringify({ success: true, data: parsed.ideas || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating trend video ideas:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
