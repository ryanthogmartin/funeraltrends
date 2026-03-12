const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNERAL_CONTEXT_KEYWORDS = [
  "green burial", "cremation", "celebration of life", "water cremation",
  "funeral pre-planning", "biodegradable casket", "memorial livestream",
  "direct cremation", "natural burial", "funeral alternatives", "aquamation",
  "death doula", "home funeral", "eco-friendly funeral", "human composting",
  "grief counseling", "end of life planning", "cremation jewelry",
  "living funeral", "tree pod burial", "mushroom burial suit",
];

async function detectEmergingTrends(perplexityKey: string): Promise<any[]> {
  console.log('[Perplexity] Detecting US funeral industry social signals...');

  // Run multiple targeted searches in parallel for different platforms
  const searches = [
    {
      source_label: 'reddit',
      domain_filter: ['reddit.com'],
      prompt: `Search Reddit (especially r/askfuneraldirectors, r/deathpositive, r/GriefSupport, r/Morticians, r/funeralhomes) for the most discussed funeral and death care topics in the United States RIGHT NOW. Look for viral posts, heated discussions, questions from families, and industry debates.

Return a JSON array of 4 objects with:
- "title": short headline summarizing the discussion (max 80 chars)
- "summary": 2-3 sentences about what's being discussed and why it matters to US funeral professionals
- "relevance_score": 1-100 how relevant to US funeral directors
- "related_keywords": array of 2-4 related terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"
- "platform": "Reddit"

Return ONLY the JSON array.`,
    },
    {
      source_label: 'tiktok',
      domain_filter: ['tiktok.com'],
      prompt: `Search TikTok for trending funeral industry content in the United States. Look for viral videos from funeral directors, morticians, embalmers, and death care professionals. Check hashtags like #funeraldirector #mortician #deathcare #embalmer #funeralhome #grieftok #deathtok.

What formats, sounds, or topics are going viral among US funeral professionals on TikTok right now?

Return a JSON array of 3 objects with:
- "title": short headline about the trending content (max 80 chars)
- "summary": 2-3 sentences about why this is trending and how a funeral home could create similar content
- "relevance_score": 1-100 how relevant to US funeral directors
- "related_keywords": array of 2-4 related hashtags or terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"
- "platform": "TikTok"

Return ONLY the JSON array.`,
    },
    {
      source_label: 'facebook',
      domain_filter: ['facebook.com'],
      prompt: `Search Facebook for trending discussions in US funeral industry groups and pages. Look at funeral director communities, NFDA groups, state funeral director association pages, and grief support communities. What are American funeral professionals talking about, sharing, or debating on Facebook right now?

Return a JSON array of 3 objects with:
- "title": short headline about the trending topic (max 80 chars)
- "summary": 2-3 sentences about the discussion and its relevance to US funeral homes
- "relevance_score": 1-100 how relevant to US funeral directors
- "related_keywords": array of 2-4 related terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"
- "platform": "Facebook"

Return ONLY the JSON array.`,
    },
    {
      source_label: 'twitter',
      domain_filter: ['twitter.com', 'x.com'],
      prompt: `Search X/Twitter for trending funeral and death care discussions in the United States. Look for tweets from funeral directors, morticians, the NFDA, state associations, and death care thought leaders. Check for breaking news, policy changes, viral moments, or industry debates happening right now.

Return a JSON array of 2 objects with:
- "title": short headline (max 80 chars)
- "summary": 2-3 sentences about what's being discussed
- "relevance_score": 1-100 how relevant to US funeral directors
- "related_keywords": array of 2-4 related terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"
- "platform": "X/Twitter"

Return ONLY the JSON array.`,
    },
    {
      source_label: 'youtube',
      domain_filter: ['youtube.com'],
      prompt: `Search YouTube for trending funeral industry videos in the United States. Look at channels like Ask a Mortician, Kari the Mortician, and other death care creators. What funeral-related video topics are getting high views or engagement right now?

Return a JSON array of 2 objects with:
- "title": short headline about the trending video topic (max 80 chars)
- "summary": 2-3 sentences about why this content is performing well and how a funeral home could adapt it
- "relevance_score": 1-100 how relevant to US funeral directors
- "related_keywords": array of 2-4 related terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"
- "platform": "YouTube"

Return ONLY the JSON array.`,
    },
  ];

  const results = await Promise.all(
    searches.map(async (search) => {
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${perplexityKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              {
                role: 'system',
                content: 'You are a US funeral industry social media analyst. Focus ONLY on trends relevant to funeral professionals in the United States. Return ONLY valid JSON, no markdown or extra text.',
              },
              { role: 'user', content: search.prompt },
            ],
            search_domain_filter: search.domain_filter,
            search_recency_filter: 'week',
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Perplexity][${search.source_label}] API error: ${response.status} ${errText}`);
          return [];
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const citations = data.citations || [];

        let trends: any[] = [];
        try {
          const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          trends = JSON.parse(cleaned);
        } catch {
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            try { trends = JSON.parse(match[0]); } catch { return []; }
          }
        }

        return trends.map((t: any) => ({
          signal_type: t.signal_type || 'emerging',
          title: (t.title || '').slice(0, 200),
          summary: `[${t.platform || search.source_label}] ${(t.summary || '').slice(0, 480)}`,
          relevance_score: Math.min(100, Math.max(1, parseInt(t.relevance_score) || 50)),
          source: search.source_label,
          source_urls: citations.slice(0, 3),
          related_keywords: (t.related_keywords || []).slice(0, 5),
        }));
      } catch (err) {
        console.error(`[Perplexity][${search.source_label}] Error:`, err);
        return [];
      }
    })
  );

  const allTrends = results.flat();
  console.log(`[Perplexity] Got ${allTrends.length} total social signals across ${searches.length} platforms`);
  return allTrends;
}

async function fetchGoogleTrendsDailyInterest(): Promise<any[]> {
  console.log('[Google Trends Daily] Fetching daily interest scores...');

  // Pick top 5 keywords for a single comparison (Google Trends limit)
  const topKeywords = FUNERAL_CONTEXT_KEYWORDS.slice(0, 5);
  const dailySignals: any[] = [];

  try {
    const comparisonItems = topKeywords.map(kw => ({
      keyword: kw,
      geo: "US",
      time: "now 7-d", // Last 7 days for daily granularity
    }));

    const req = JSON.stringify({
      comparisonItem: comparisonItems,
      category: 0,
      property: "",
    });

    const exploreUrl = `https://trends.google.com/trends/api/explore?hl=en-US&tz=240&req=${encodeURIComponent(req)}`;

    const exploreRes = await fetch(exploreUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!exploreRes.ok) {
      console.log(`[Google Trends Daily] Explore failed: ${exploreRes.status}`);
      await exploreRes.text();
      return [];
    }

    const exploreText = await exploreRes.text();
    const cleanedExplore = exploreText.replace(/^\)\]\}',?\n/, '');
    const exploreData = JSON.parse(cleanedExplore);

    const timeseriesWidget = exploreData.widgets?.find((w: any) => w.id === 'TIMESERIES');
    if (!timeseriesWidget) return [];

    const token = timeseriesWidget.token;
    const timeseriesReq = JSON.stringify(timeseriesWidget.request);
    const multilineUrl = `https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=240&req=${encodeURIComponent(timeseriesReq)}&token=${token}`;

    const dataRes = await fetch(multilineUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!dataRes.ok) {
      await dataRes.text();
      return [];
    }

    const dataText = await dataRes.text();
    const cleanedData = dataText.replace(/^\)\]\}',?\n/, '');
    const timeseriesData = JSON.parse(cleanedData);
    const timelineData = timeseriesData.default?.timelineData || [];

    for (let ki = 0; ki < topKeywords.length; ki++) {
      const keyword = topKeywords[ki];
      const values = timelineData.map((p: any) => p.value?.[ki] ?? 0);

      if (values.length < 2) continue;

      const latest = values[values.length - 1];
      const dayBefore = values[values.length - 2];
      const weekAvg = values.reduce((a: number, b: number) => a + b, 0) / values.length;

      // Only report significant daily movement (>20% change)
      if (dayBefore > 0) {
        const dailyChange = Math.round(((latest - dayBefore) / dayBefore) * 100);
        if (Math.abs(dailyChange) >= 20) {
          dailySignals.push({
            signal_type: dailyChange > 0 ? 'growing' : 'emerging',
            title: `"${keyword}" ${dailyChange > 0 ? 'spiking' : 'declining'} ${Math.abs(dailyChange)}% today`,
            summary: `Google Trends shows "${keyword}" moved ${dailyChange > 0 ? 'up' : 'down'} ${Math.abs(dailyChange)}% in the last 24 hours. Current interest: ${latest}/100 (7-day avg: ${Math.round(weekAvg)}/100).`,
            relevance_score: Math.min(100, Math.abs(dailyChange)),
            source: 'google_trends_daily',
            source_urls: [`https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&geo=US&date=now%207-d`],
            related_keywords: [keyword],
          });
        }
      }
    }

    console.log(`[Google Trends Daily] Found ${dailySignals.length} significant movements`);
  } catch (err) {
    console.error('[Google Trends Daily] Error:', err);
  }

  return dailySignals;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('[Trend Signals] Starting detection...');

    // Run both sources in parallel
    const [aiTrends, dailyTrends] = await Promise.all([
      perplexityKey ? detectEmergingTrends(perplexityKey) : Promise.resolve([]),
      fetchGoogleTrendsDailyInterest(),
    ]);

    const allSignals = [...aiTrends, ...dailyTrends];
    console.log(`[Trend Signals] Got ${aiTrends.length} AI signals + ${dailyTrends.length} daily movement signals`);

    // Clear old signals and insert new
    await supabase.from('trend_signals').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (allSignals.length > 0) {
      const { error } = await supabase.from('trend_signals').insert(allSignals);
      if (error) console.error('[Trend Signals] Insert error:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ai_signals: aiTrends.length,
        daily_signals: dailyTrends.length,
        total: allSignals.length,
        fetched_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[Trend Signals] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
