const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};




// ─── FORBIDDEN WORDS ──────────────────────────────────────────────────────────
const FORBIDDEN = `FORBIDDEN — NEVER USE IN ANY IDEA TITLE OR HOOK:
dignified, compassionate, heartfelt, loved one (say "your dad/mom/husband/wife"), passing (say "when someone dies"), transition, at this difficult time, here for you, loving tribute, final farewell, laid to rest, dedicated staff, honor their memory, quality care, serving families since, gone but not forgotten, rest in peace, grief journey, healing process, closure, beautiful service, peace of mind, meaningful goodbye, affordable options (be specific).
Use real words: die, death, dead, body, cost, price. If it sounds like a funeral home brochure — rewrite it.`;




// ─── AUDIENCE ─────────────────────────────────────────────────────────────────
const AUDIENCE = `VIEWER: Not in crisis. Age 45-65, scrolling social media on a weekday evening. Aging parents. Curious, not grieving. Starting to think about arrangements. Has questions they're embarrassed to ask. Stopped because the hook surprised them.`;




// ─── BUSINESS TYPE CONTEXTS ───────────────────────────────────────────────────
const BIZ_CONTEXT: Record<string, string> = {
  "funeral-home": `BUSINESS: Funeral Home. Insider knowledge to draw from: POA ends the moment the person dies. Embalming is not legally required in most states. Pre-arrangements can be transferred between funeral homes. Families choose competitors because the competitor is more known — not because they're better. Direct cremation doesn't mean no service. The casket room is psychologically designed — families overspend because they feel guilty choosing lower-cost options. Thumbprint is taken before cremation for ID. Price is the excuse families give — familiarity is the real reason.`,




  "cemetery": `BUSINESS: Cemetery. Insider knowledge: "Perpetual care" doesn't mean what families think it means. Cemetery lots have deeds and can be resold. Buying in advance locks today's price. Veteran burial benefits are massively underutilized — not automatic, must be applied for. Green burial sections exist inside many traditional cemeteries. The difference between plots, mausoleum spaces, niches, and columbarium spaces has real cost and access implications families don't understand.`,




  "crematory": `BUSINESS: Crematory. Insider knowledge: Flame cremation = 2-3 hours at 1,400-1,800°F. Aquamation (water cremation) = 12-18 hours, produces ~20% more remains, finer and whiter. A stainless steel ID tag travels with the body through the entire process — this is how ID is guaranteed. The ashes are pulverized bone fragments, not ash — white/gray and heavier than expected. Individual vs. communal cremation is a critical distinction families often don't understand. Direct cremation doesn't mean no service.`,




  "pet-cremation": `BUSINESS: Pet Cremation. Insider knowledge: Pet grief is neurologically identical to human grief — it is not smaller grief. Individual cremation = one animal only in chamber. Communal = multiple animals, no individual remains. An ID tag travels with the animal. The remains are bone fragments, not ash. The guilt of having made the end-of-life decision compounds the grief — this deserves to be named. Most people don't know their full range of options for memorialization. In-home euthanasia is available but few know to ask.`
};




// ─── CONTENT CATEGORY CONTEXT ─────────────────────────────────────────────────
const CAT_CONTEXT: Record<string, string> = {
  "demystify": `CONTENT ANGLE: Process & Demystification. Videos that pull back the curtain — what actually happens during embalming, cremation, the first call at 2am, what tools are used, how long things take. Answer the question families are afraid to Google. Be specific. Specific reduces fear. Vague increases it.`,




  "value": `CONTENT ANGLE: Value & Price Transparency. Not defensive — confident. "Here's exactly what you're paying for and here's what you give up by going cheaper." Help families evaluate value, not just price. Specific about what's included and excluded.`,




  "legal": `CONTENT ANGLE: Legal & Decision Clarity. Who has decision-making authority. What POA covers and when it ends (immediately at death). Two types of organ donation. Pre-arrangement rights. Why a thumbprint is taken. These questions cause family conflict. Answer them before the moment of need.`,




  "preplanning": `CONTENT ANGLE: Pre-Planning & Pre-Need. Pre-planning as a gift to the family left behind. Cover: planning vs. pre-paying (two different things), transferring arrangements, what to do if a funeral home closes, how to start the conversation with aging parents. One concrete next step per video.`,




  "mythbust": `CONTENT ANGLE: Myth Busting. State the myth-bust in the first sentence — not "did you know?" but the actual fact. "You don't have to be embalmed." "Caskets don't have to be purchased from the funeral home." "Your POA ends the moment they die." First line creates the pattern interrupt.`
};




// ─── PLATFORM CONTEXT ─────────────────────────────────────────────────────────
const PLATFORM_CONTEXT: Record<string, string> = {
  "facebook": `PLATFORM: Facebook. Audience 50-70. Storytelling openings work. Neighbor-to-neighbor tone. Community connection.`,
  "reels": `PLATFORM: Instagram Reels / TikTok. Audience 38-55. First sentence stops the scroll — no setup. Most surprising thing first. Fast pace.`,
  "youtube": `PLATFORM: YouTube Shorts. Audience 42-65. Educational framing. "The real answer to..." still start strong.`
};




// ─── HANDLER ──────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });




  try {
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




    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    const bizLabel = {
      "funeral-home": "Funeral Home",
      "cemetery": "Cemetery",
      "crematory": "Crematory",
      "pet-cremation": "Pet Cremation Business"
    }[bizType] || "Funeral Home";




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




    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.88,
        max_tokens: 700,
      }),
    });




    if (!response.ok) {
      const errText = await response.text();
      console.error('AI gateway error:', response.status, errText);
      if (response.status === 429) return new Response(JSON.stringify({ success: false, error: 'Rate limit — try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: false, error: `AI request failed: ${response.status}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }




    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';




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
