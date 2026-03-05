const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FUNERAL_KEYWORDS = [
  "green burial",
  "cremation cost",
  "celebration of life",
  "water cremation",
  "funeral pre-planning",
  "biodegradable casket",
  "memorial livestream",
  "direct cremation",
  "natural burial",
  "funeral alternatives",
  "aquamation",
  "death doula",
  "home funeral",
  "eco-friendly funeral",
  "alkaline hydrolysis",
  "funeral costs average",
  "cremation jewelry",
  "living funeral",
  "tree pod burial",
  "human composting",
  "grief counseling",
  "end of life planning",
  "memorial reef",
  "mushroom burial suit",
];

const FUNERAL_SUBREDDITS = [
  "funeral",
  "DeathPositive",
  "GriefSupport",
  "personalfinance+funeral",
  "Futurology",
  "askfuneraldirectors",
];

// ─── Google Ads Keyword Planner ────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET')!;
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN')!;

  const res = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OAuth token error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchKeywordPlannerData(): Promise<any[]> {
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID');
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN');
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');

  console.log('[Google Ads] Starting fetch...');
  console.log(`[Google Ads] Secrets present: clientId=${!!clientId}, clientSecret=${!!clientSecret}, refreshToken=${!!refreshToken}, customerId=${!!customerId}, managerId=${!!managerCustomerId}, devToken=${!!developerToken}`);

  if (!clientId || !clientSecret || !refreshToken || !customerId || !managerCustomerId || !developerToken) {
    console.error('[Google Ads] Missing required secrets, falling back to synthetic data');
    return generateSyntheticTrends();
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
    console.log('[Google Ads] Got access token successfully');
  } catch (err) {
    console.error('[Google Ads] Failed to get access token:', err.message || err);
    return generateSyntheticTrends();
  }

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const body = {
    keywords: FUNERAL_KEYWORDS,
    language: 'languageConstants/1000',
    geoTargetConstants: ['geoTargetConstants/2840'],
    keywordPlanNetwork: 'GOOGLE_SEARCH',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'login-customer-id': managerCustomerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Google Ads API error ${res.status}: ${errText}`);
      return generateSyntheticTrends();
    }

    const data = await res.json();
    const trends: any[] = [];

    for (const result of (data.results || [])) {
      const keyword = result.text || '';
      const metrics = result.keywordMetrics || {};
      const avgSearches = parseInt(metrics.avgMonthlySearches) || 0;

      // Build sparkline from monthly search volumes
      const monthlyVolumes = (metrics.monthlySearchVolumes || [])
        .slice(-12)
        .map((m: any) => parseInt(m.monthlySearches) || 0);

      // Calculate change percent from last two months
      let changePercent = 0;
      if (monthlyVolumes.length >= 2) {
        const recent = monthlyVolumes[monthlyVolumes.length - 1];
        const previous = monthlyVolumes[monthlyVolumes.length - 2];
        if (previous > 0) {
          changePercent = Math.round(((recent - previous) / previous) * 100);
        }
      }

      trends.push({
        keyword,
        volume: avgSearches,
        change_percent: changePercent,
        sparkline: monthlyVolumes.length > 0 ? monthlyVolumes : generateSparkline(avgSearches),
        competition: metrics.competition || 'UNSPECIFIED',
        competition_index: parseInt(metrics.competitionIndex) || 0,
      });
    }

    console.log(`Google Ads API returned ${trends.length} keywords with real data`);
    return trends.sort((a, b) => b.volume - a.volume).slice(0, 24);
  } catch (err) {
    console.error('Error calling Google Ads API:', err);
    return generateSyntheticTrends();
  }
}

function generateSyntheticTrends(): any[] {
  return FUNERAL_KEYWORDS.map((keyword) => {
    const baseVolume = Math.floor(Math.random() * 10000) + 1000;
    return {
      keyword,
      volume: baseVolume,
      change_percent: Math.floor(Math.random() * 80) - 20,
      sparkline: generateSparkline(baseVolume),
    };
  }).sort((a, b) => b.volume - a.volume).slice(0, 24);
}

function generateSparkline(maxVolume: number): number[] {
  const points: number[] = [];
  let value = maxVolume * 0.3;
  for (let i = 0; i < 12; i++) {
    value += (Math.random() - 0.4) * maxVolume * 0.15;
    value = Math.max(0, Math.min(maxVolume * 1.1, value));
    points.push(Math.round(value));
  }
  return points;
}

// ─── Reddit ────────────────────────────────────────────────────────────

async function fetchRedditPosts(): Promise<any[]> {
  const posts: any[] = [];
  const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

  for (const sub of FUNERAL_SUBREDDITS) {
    try {
      const searchUrl = `https://www.reddit.com/r/${sub}/search.json?q=funeral+OR+burial+OR+cremation+OR+obituary+OR+memorial&sort=hot&t=day&limit=10&restrict_sr=on`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'FuneralTrendsDashboard/1.0' },
      });
      if (!res.ok) { console.log(`Reddit r/${sub}: ${res.status}`); continue; }
      const data = await res.json();
      for (const child of (data?.data?.children || [])) {
        const post = child.data;
        if (post.created_utc >= oneDayAgo) {
          posts.push({
            reddit_id: post.id, title: post.title,
            subreddit: `r/${post.subreddit}`, score: post.score,
            num_comments: post.num_comments,
            url: `https://reddit.com${post.permalink}`,
            posted_at: new Date(post.created_utc * 1000).toISOString(),
            sentiment: analyzeSentiment(post.title),
          });
        }
      }
    } catch (err) { console.error(`Error r/${sub}:`, err); }
  }

  try {
    const globalUrl = `https://www.reddit.com/search.json?q=funeral+OR+burial+OR+cremation+OR+"green+burial"+OR+"death+care"&sort=hot&t=day&limit=25`;
    const res = await fetch(globalUrl, { headers: { 'User-Agent': 'FuneralTrendsDashboard/1.0' } });
    if (res.ok) {
      const data = await res.json();
      for (const child of (data?.data?.children || [])) {
        const post = child.data;
        if (post.created_utc >= oneDayAgo && !posts.find(p => p.reddit_id === post.id)) {
          posts.push({
            reddit_id: post.id, title: post.title,
            subreddit: `r/${post.subreddit}`, score: post.score,
            num_comments: post.num_comments,
            url: `https://reddit.com${post.permalink}`,
            posted_at: new Date(post.created_utc * 1000).toISOString(),
            sentiment: analyzeSentiment(post.title),
          });
        }
      }
    }
  } catch (err) { console.error('Error global Reddit:', err); }

  return posts.sort((a, b) => b.score - a.score).slice(0, 20);
}

function analyzeSentiment(text: string): string {
  const lower = text.toLowerCase();
  const pos = ['beautiful', 'love', 'wonderful', 'amazing', 'great', 'recommend', 'perfect', 'celebration', 'honor', 'peaceful', 'helpful'];
  const neg = ['scam', 'rip off', 'expensive', 'overpriced', 'terrible', 'awful', 'worst', 'angry', 'disgusting', 'predatory', 'outrage'];
  const p = pos.filter(w => lower.includes(w)).length;
  const n = neg.filter(w => lower.includes(w)).length;
  return p > n ? 'positive' : n > p ? 'negative' : 'neutral';
}

// ─── Main Handler ──────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('[v2] Fetching funeral trends data (Google Ads + Reddit)...');

    const [trends, redditPosts] = await Promise.all([
      fetchKeywordPlannerData(),
      fetchRedditPosts(),
    ]);

    console.log(`Fetched ${trends.length} trends and ${redditPosts.length} Reddit posts`);

    // Clear old data and insert new
    await supabase.from('funeral_trends').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('funeral_reddit_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (trends.length > 0) {
      const { error: trendsError } = await supabase.from('funeral_trends').insert(
        trends.map(t => ({
          keyword: t.keyword,
          volume: t.volume,
          change_percent: t.change_percent,
          sparkline: t.sparkline,
        }))
      );
      if (trendsError) console.error('Error inserting trends:', trendsError);
    }

    if (redditPosts.length > 0) {
      const { error: redditError } = await supabase.from('funeral_reddit_posts').upsert(
        redditPosts, { onConflict: 'reddit_id' }
      );
      if (redditError) console.error('Error inserting reddit posts:', redditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: trends.length > 0 && trends[0].competition ? 'google_ads_api' : 'synthetic_fallback',
        trends_count: trends.length,
        reddit_count: redditPosts.length,
        fetched_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in fetch-funeral-data:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
