import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildVoicePrompt(vp: any): string {
  const toneMap: Record<string, string> = {
    'warm-empathetic': 'Warm, empathetic, and caring. Speak like a trusted friend who also happens to be a funeral professional.',
    'professional-authoritative': 'Confident and authoritative. Knowledgeable expert that families trust completely.',
    'down-to-earth': 'Casual, approachable, and real. Talk about tough topics in a relatable way.',
    'reverent-formal': 'Dignified, respectful, and traditional. Maintain a sense of reverence.',
  };

  const vocabMap: Record<string, string> = {
    'everyday': 'Use simple, everyday language that any family would understand. Avoid jargon.',
    'mixed': 'Use industry terms occasionally but always explain them in plain language.',
    'professional': 'Use professional funeral industry terminology freely.',
  };

  const pacingMap: Record<string, string> = {
    'short-punchy': 'Use short, punchy sentences. Rapid-fire delivery. Quick beats.',
    'mixed': 'Use a natural mix of short and longer sentences.',
    'flowing': 'Use longer, flowing sentences with a storytelling cadence.',
  };

  const humorMap: Record<string, string> = {
    'no-humor': 'Keep the tone strictly serious and professional. No humor.',
    'light-humor': 'Light, gentle humor is OK when it fits naturally.',
    'personality-driven': 'Let personality and natural humor shine through when appropriate.',
  };

  const ctaMap: Record<string, string> = {
    'soft-ask': 'End with a soft, gentle ask — like "If this helped, consider sharing it."',
    'direct-cta': 'End with a direct call to action — like "Follow for more and drop a comment."',
    'question': 'End by asking the audience a question to spark comments.',
    'emotional-close': 'End with an emotional, supportive close — like "You don\'t have to go through this alone."',
  };

  const audienceAgeMap: Record<string, string> = {
    'millennials': 'Target audience is Millennials (25–40). Use casual, relatable language. Pop culture references OK.',
    'gen-x': 'Target audience is Gen X (40–55). Be practical and direct. No-nonsense tone.',
    'boomers': 'Target audience is Boomers (55+). Use traditional, respectful language. Avoid slang.',
    'all-ages': 'Speak to all age groups. Use universal language everyone understands.',
  };

  const videoStyleMap: Record<string, string> = {
    'talking-head': 'Structure as a direct-to-camera talking head script. Personal, eye-contact feel.',
    'storytelling': 'Structure as a narrative story. Build tension, deliver a lesson or emotional payoff.',
    'quick-tips': 'Structure as numbered quick tips or a listicle. Fast, snappy, easy to follow.',
    'emotional': 'Structure for maximum emotional impact. Build to a powerful, moving moment.',
    'educational': 'Structure as a clear explainer. Walk through concepts step by step.',
  };

  const faithMap: Record<string, string> = {
    'faith-based': 'This person is comfortable with faith references. Scripture, God, prayer are welcome when relevant.',
    'secular': 'Keep all content secular. Do NOT reference God, faith, prayer, or any religion.',
    'culturally-diverse': 'Be respectful of many faith traditions. Reference diversity of beliefs positively.',
    'prefer-not': 'Avoid religious references unless the topic specifically calls for it.',
  };

  const anecdoteMap: Record<string, string> = {
    'never': 'Do NOT include personal anecdotes or "I once had a family…" stories. Keep it factual.',
    'occasionally': 'Include a brief personal anecdote only when it strongly supports the point.',
    'frequently': 'Weave in personal stories and "I remember when…" moments — this is how they connect with their audience.',
  };

  let prompt = `VOICE PROFILE — Write the script AS this funeral professional:\n\n`;
  
  if (vp.funeral_home_name) prompt += `They work at ${vp.funeral_home_name}. `;
  if (vp.years_experience) prompt += `They have ${vp.years_experience} years of experience. `;
  if (vp.specialties) prompt += `Their specialties include: ${vp.specialties}. `;
  
  if (vp.origin_story?.trim()) {
    prompt += `\n\nORIGIN STORY (weave this in naturally when relevant, don't force it): ${vp.origin_story}`;
  }

  prompt += `\n\nTONE: ${toneMap[vp.tone_descriptor] || toneMap['warm-empathetic']}`;
  prompt += `\nVOCABULARY: ${vocabMap[vp.vocabulary_level] || vocabMap['everyday']}`;
  prompt += `\nAUDIENCE: Address the audience as "${vp.audience_address || 'families'}".`;
  prompt += `\nTARGET DEMOGRAPHIC: ${audienceAgeMap[vp.target_audience_age] || audienceAgeMap['all-ages']}`;
  prompt += `\nVIDEO STYLE: ${videoStyleMap[vp.video_style] || videoStyleMap['talking-head']}`;
  prompt += `\nPACING: ${pacingMap[vp.pacing_style] || pacingMap['mixed']}`;
  prompt += `\nHUMOR: ${humorMap[vp.humor_comfort] || humorMap['no-humor']}`;
  prompt += `\nFAITH LENS: ${faithMap[vp.faith_lens] || faithMap['prefer-not']}`;
  prompt += `\nPERSONAL STORIES: ${anecdoteMap[vp.anecdote_style] || anecdoteMap['occasionally']}`;
  prompt += `\nENDING STYLE: ${ctaMap[vp.cta_style] || ctaMap['soft-ask']}`;

  if (vp.signature_opening?.trim()) {
    prompt += `\n\nSIGNATURE OPENING — Start the hook with or inspired by: "${vp.signature_opening}"`;
  }

  if (vp.content_pillars?.trim()) {
    const pillars = vp.content_pillars.split(',').join(', ');
    prompt += `\n\nCONTENT PILLARS — This creator focuses on: ${pillars}. Lean into these angles when writing.`;
  }

  if (vp.catchphrases?.trim()) {
    prompt += `\n\nNATURALLY WEAVE IN these signature phrases when they fit (don't force them): ${vp.catchphrases}`;
  }

  if (vp.taboo_topics?.trim()) {
    prompt += `\n\n⚠️ HARD AVOID — NEVER mention or reference any of the following: ${vp.taboo_topics}`;
  }

  if (vp.sample_script?.trim()) {
    prompt += `\n\nHere's a sample of how this person actually speaks — match this voice closely:\n"${vp.sample_script.slice(0, 1500)}"`;
  }

  return prompt;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, tone, userId } = await req.json();

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

    // Try to fetch voice profile if userId is provided
    let voiceProfilePrompt = '';
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: vp } = await supabase
          .from('voice_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (vp) {
          voiceProfilePrompt = buildVoicePrompt(vp);
        }
      } catch (e) {
        console.error('Failed to fetch voice profile:', e);
      }
    }

    // Fallback tone descriptions when no voice profile
    const toneDescriptions: Record<string, string> = {
      'compassionate-educator': 'Warm, empathetic, and educational. Speak like a caring funeral director who wants to inform and comfort. Use gentle language and reassuring tone.',
      'industry-insider': 'Confident and authoritative. Share insider knowledge about the funeral industry with a "let me tell you what most people don\'t know" energy. Direct and informative.',
      'myth-buster': 'Bold and slightly provocative. Challenge common misconceptions about funerals and death care. Use a "did you know?" hook style. Engaging and surprising.',
      'comforting-guide': 'Soft, supportive, and nurturing. Like a trusted friend helping someone through a difficult time. Focus on emotional support while providing practical guidance.',
    };

    const toneGuide = voiceProfilePrompt || `Tone: ${toneDescriptions[tone] || toneDescriptions['compassionate-educator']}`;

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
            content: `You write 45-second video scripts for funeral directors to use on TikTok, Instagram Reels, and YouTube Shorts. The script is written FROM the funeral director's perspective — they are the one speaking on camera as the expert. The script should be teleprompter-ready — natural spoken language, not written prose.

${toneGuide}

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
