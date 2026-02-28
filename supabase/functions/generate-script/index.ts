const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, tone } = await req.json();

    if (!idea || !tone) {
      return new Response(
        JSON.stringify({ success: false, error: 'idea and tone are required' }),
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

    const toneDescriptions: Record<string, string> = {
      'compassionate-educator': 'Warm, empathetic, and educational. Speak like a caring funeral director who wants to inform and comfort. Use gentle language and reassuring tone.',
      'industry-insider': 'Confident and authoritative. Share insider knowledge about the funeral industry with a "let me tell you what most people don\'t know" energy. Direct and informative.',
      'myth-buster': 'Bold and slightly provocative. Challenge common misconceptions about funerals and death care. Use a "did you know?" hook style. Engaging and surprising.',
      'comforting-guide': 'Soft, supportive, and nurturing. Like a trusted friend helping someone through a difficult time. Focus on emotional support while providing practical guidance.',
    };

    const toneGuide = toneDescriptions[tone] || toneDescriptions['compassionate-educator'];

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
            content: `You write 45-second video scripts for funeral directors to use on TikTok, Instagram Reels, and YouTube Shorts. The script should be teleprompter-ready — natural spoken language, not written prose.

Tone: ${toneGuide}

Format the script with:
- A hook (first 3 seconds to grab attention)
- Main content (education/story/myth-bust)  
- Call to action (follow, comment, share)

Keep it under 120 words (roughly 45 seconds when spoken). Use short sentences. Include [PAUSE] markers where the speaker should breathe or let a point land. Do NOT use emojis in the script.

Return ONLY valid JSON, no markdown.`
          },
          {
            role: 'user',
            content: `Write a 45-second video script for this topic: "${idea}"

Return JSON in this exact format:
{"hook": "opening 3-second hook line", "body": "main script content with [PAUSE] markers", "cta": "closing call to action", "wordCount": 95}`
          }
        ],
        temperature: 0.85,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
    console.error('Error generating script:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
