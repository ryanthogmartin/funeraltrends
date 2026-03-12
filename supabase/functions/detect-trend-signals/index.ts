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
  console.log('[Perplexity] Detecting emerging funeral industry trends...');

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
          content: 'You are a funeral industry trend analyst. Return ONLY valid JSON, no markdown or extra text.',
        },
        {
          role: 'user',
          content: `Find the top 8 emerging or trending topics in the funeral and death care industry RIGHT NOW (today/this week). Focus on:
- New regulations or legislation affecting funerals
- Viral social media discussions about death care
- New funeral technology or services gaining attention  
- Consumer behavior shifts in end-of-life planning
- Breaking news in the funeral industry

For each trend, return a JSON array with objects containing:
- "title": short headline (max 80 chars)
- "summary": 2-3 sentence explanation of why this is trending now
- "relevance_score": 1-100 how relevant to funeral professionals
- "related_keywords": array of 2-4 related search terms
- "signal_type": one of "breaking", "emerging", "growing", "viral"

Return ONLY the JSON array, nothing else.`,
        },
      ],
      search_recency_filter: 'day',
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Perplexity] API error: ${response.status} ${errText}`);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  const citations = data.citations || [];

  console.log('[Perplexity] Raw response length:', content.length);

  // Parse JSON from response (handle markdown code blocks)
  let trends: any[] = [];
  try {
    const cleaned = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    trends = JSON.parse(cleaned);
  } catch (e) {
    // Try to find JSON array in the text
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        trends = JSON.parse(match[0]);
      } catch (e2) {
        console.error('[Perplexity] Failed to parse response:', e2);
        return [];
      }
    }
  }

  // Attach citation URLs
  return trends.map((t: any) => ({
    signal_type: t.signal_type || 'emerging',
    title: (t.title || '').slice(0, 200),
    summary: (t.summary || '').slice(0, 500),
    relevance_score: Math.min(100, Math.max(1, parseInt(t.relevance_score) || 50)),
    source: 'perplexity',
    source_urls: citations.slice(0, 5),
    related_keywords: (t.related_keywords || []).slice(0, 5),
  }));
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
