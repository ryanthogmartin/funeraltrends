const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Master keyword list (225 keywords, 15 categories) ────────────────

const KEYWORD_CATEGORIES: Record<string, string[]> = {
  "funeral-general": [
    "funeral", "funeral services", "funeral directors", "funeral arrangements", "funeral planning",
    "funeral etiquette", "what to wear to a funeral", "funeral flowers", "funeral flower arrangements",
    "funeral music", "what to say at a funeral", "funeral parlor", "funeral home", "funeral procession",
    "funeral reception ideas",
  ],
  "cremation": [
    "cremation", "cremation services", "direct cremation", "direct cremation cost",
    "how much does cremation cost", "cremation vs burial", "what is direct cremation",
    "full service cremation", "cremation urns", "what to do with ashes after cremation",
    "how long does cremation take", "aquamation water cremation", "affordable cremation services",
    "cremation cost by state", "scattering ashes laws",
  ],
  "death-burial": [
    "caskets", "coffins", "burial services", "burial plots", "embalming", "hearse",
    "graveside service", "direct burial", "immediate burial", "burial vault", "mausoleum",
    "what is a burial vault", "open casket funeral", "military burial", "headstones and grave markers",
  ],
  "death-certificates": [
    "how to get a death certificate", "death certificate copy", "death certificate request",
    "certified copy of death certificate", "how long does a death certificate take",
    "how many death certificates do I need", "death certificate cost", "death certificate apostille",
    "how to obtain a death certificate for a parent", "death certificate name change",
    "death certificate vs death notice", "online death certificate request",
    "vital records death certificate", "replace lost death certificate",
    "death certificate after cremation",
  ],
  "eco-friendly": [
    "green burial", "natural burial", "eco friendly burial", "biodegradable casket",
    "conservation burial", "water cremation aquamation", "human composting burial",
    "natural burial vs cremation", "shroud burial", "green burial cost", "biodegradable urn",
    "forest burial", "alkaline hydrolysis", "what is a green burial", "green burial cemetery",
  ],
  "funeral-pricing": [
    "how much does a funeral cost", "average funeral cost", "funeral cost breakdown",
    "cheap funeral options", "affordable funeral services", "funeral pre-planning costs",
    "funeral price list", "direct cremation cost vs burial", "funeral home price comparison",
    "low cost funeral options", "funeral expenses who pays", "prepaid funeral plans",
    "funeral insurance", "burial insurance", "final expense insurance",
  ],
  "preplanning": [
    "funeral pre-planning", "prepaid funeral plans", "how to pre-plan a funeral",
    "funeral prearrangement", "pre-need funeral planning", "funeral pre-planning costs",
    "benefits of pre-planning a funeral", "funeral planning checklist",
    "pre-planned funeral vs prepaid funeral", "how to plan a funeral in advance",
    "funeral wishes document", "end of life planning", "advance funeral directive",
    "what happens if you don't pre-plan a funeral", "funeral pre-planning for aging parents",
  ],
  "funeral-products": [
    "funeral urns", "casket prices", "keepsake urns", "memorial jewelry from ashes",
    "biodegradable urns", "funeral program templates", "memorial candles", "cremation jewelry",
    "funeral wreaths", "memorial plaques", "sympathy gift baskets", "memorial wind chimes",
    "personalized urns", "funeral casket sprays", "memorial stones and garden markers",
  ],
  "cemetery": [
    "cemetery", "burial plots cost", "cemetery plot prices", "national cemetery",
    "veterans cemetery", "cemetery records", "how to find a grave", "cemetery memorial gardens",
    "pet cemetery", "conservation cemetery", "mausoleum cost", "cemetery maintenance fees",
    "cemetery plot transfer", "columbarium", "find a grave online",
  ],
  "pet-services": [
    "pet cremation", "pet cremation cost", "pet funeral services", "how to handle pet loss",
    "pet burial options", "dog cremation", "cat cremation", "pet memorial ideas", "pet cemetery",
    "pet urns", "pet loss grief support", "in-home pet euthanasia", "pet memorial jewelry",
    "biodegradable pet urns", "paw print memorial keepsakes",
  ],
  "grief-healing": [
    "grief support", "grief counseling", "stages of grief", "how to cope with loss",
    "bereavement support", "grief support groups", "coping with the death of a parent",
    "coping with the death of a spouse", "grief after loss of a child", "how long does grief last",
    "grief therapist", "complicated grief", "anticipatory grief", "online grief support",
    "grief books and resources",
  ],
  "veteran-services": [
    "veteran burial benefits", "VA burial allowance", "free burial for veterans",
    "veterans national cemetery", "military funeral honors", "how to apply for VA burial benefits",
    "veteran cremation benefits", "military funeral flag ceremony", "presidential memorial certificate",
    "veteran headstone application", "military funeral honors eligibility",
    "VA burial benefit reimbursement", "veteran survivor benefits", "TRICARE funeral benefits",
    "veteran pre-need burial eligibility",
  ],
  "aftercare-services": [
    "funeral aftercare services", "bereavement follow up", "grief support after funeral",
    "estate settlement assistance", "what to do after a funeral", "post funeral checklist",
    "survivor benefits after death", "notifying agencies after death", "closing accounts after death",
    "how to cancel subscriptions after death", "transferring assets after death",
    "probate process after death", "memorial anniversary support", "bereavement leave resources",
    "digital estate planning after death",
  ],
  "funeral-home-marketing": [
    "funeral home website design", "funeral home SEO", "funeral home social media marketing",
    "funeral home Google ads", "funeral home reputation management", "funeral home email marketing",
    "funeral home branding", "funeral home online reviews", "funeral home digital marketing",
    "funeral home content marketing", "funeral home Google Business Profile",
    "funeral home video marketing", "funeral home community outreach",
    "funeral home PPC advertising", "funeral home obituary marketing",
  ],
  "celebration-of-life": [
    "celebration of life", "celebration of life ideas", "celebration of life vs funeral",
    "how to plan a celebration of life", "celebration of life themes", "celebration of life venues",
    "outdoor celebration of life ideas", "celebration of life decorations",
    "celebration of life invitations", "celebration of life food ideas",
    "celebration of life music playlist", "virtual celebration of life",
    "celebration of life speech ideas", "celebration of life activities for guests",
    "unique celebration of life ideas",
  ],
};

function getAllKeywords(): string[] {
  return Object.values(KEYWORD_CATEGORIES).flat();
}

function getCategoryForKeyword(keyword: string): string {
  const lower = keyword.toLowerCase();
  for (const [cat, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
    if (keywords.some(k => k.toLowerCase() === lower)) return cat;
  }
  return "custom";
}

// ─── Reddit subreddits ────────────────────────────────────────────────

const FUNERAL_SUBREDDITS = [
  "funeral", "DeathPositive", "GriefSupport", "personalfinance+funeral",
  "Futurology", "askfuneraldirectors",
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

async function fetchKeywordBatch(
  accessToken: string,
  keywords: string[],
  customerId: string,
  managerCustomerId: string,
  developerToken: string,
): Promise<any[]> {
  const url = `https://googleads.googleapis.com/v21/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const body = {
    keywords,
    language: 'languageConstants/1000',
    geoTargetConstants: ['geoTargetConstants/2840'],
    keywordPlanNetwork: 'GOOGLE_SEARCH',
  };

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
    return [];
  }

  const data = await res.json();
  const results: any[] = [];

  for (const result of (data.results || [])) {
    const keyword = result.text || '';
    const metrics = result.keywordMetrics || {};
    const avgSearches = parseInt(metrics.avgMonthlySearches) || 0;

    const monthlyVolumes = (metrics.monthlySearchVolumes || [])
      .slice(-12)
      .map((m: any) => parseInt(m.monthlySearches) || 0);

    let changePercent = 0;
    if (monthlyVolumes.length >= 2) {
      const recent = monthlyVolumes[monthlyVolumes.length - 1];
      const previous = monthlyVolumes[monthlyVolumes.length - 2];
      if (previous > 0) {
        changePercent = Math.round(((recent - previous) / previous) * 100);
      }
    }

    results.push({
      keyword,
      volume: avgSearches,
      change_percent: changePercent,
      sparkline: monthlyVolumes.length > 0 ? monthlyVolumes : generateSparkline(avgSearches),
      competition: metrics.competition || 'UNSPECIFIED',
      competition_index: parseInt(metrics.competitionIndex) || 0,
      category: getCategoryForKeyword(keyword),
      source: 'google_ads',
    });
  }

  return results;
}

async function fetchKeywordPlannerData(extraKeywords: string[] = []): Promise<any[]> {
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID');
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN');
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');

  console.log('[Google Ads] Starting fetch...');

  if (!clientId || !clientSecret || !refreshToken || !customerId || !managerCustomerId || !developerToken) {
    console.error('[Google Ads] Missing required secrets, skipping');
    return [];
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
    console.log('[Google Ads] Got access token successfully');
  } catch (err) {
    console.error('[Google Ads] Failed to get access token:', err.message || err);
    return [];
  }

  // Combine master list + any user-added keywords
  const allKeywords = [...new Set([...getAllKeywords(), ...extraKeywords])];
  console.log(`[Google Ads] Total keywords to fetch: ${allKeywords.length}`);

  const BATCH_SIZE = 200;
  const allResults: any[] = [];

  for (let i = 0; i < allKeywords.length; i += BATCH_SIZE) {
    const batch = allKeywords.slice(i, i + BATCH_SIZE);
    console.log(`[Google Ads] Fetching batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} keywords)...`);
    const results = await fetchKeywordBatch(accessToken, batch, customerId!, managerCustomerId!, developerToken!);
    allResults.push(...results);
  }

  console.log(`[Google Ads] Returned ${allResults.length} keywords with real data`);
  return allResults.sort((a, b) => b.volume - a.volume);
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

    console.log('[v4] Fetching funeral trends (225 keywords, 15 categories) + Reddit...');

    // Fetch any user-added keywords to include in the API call
    const { data: userKeywords } = await supabase.from('user_keywords').select('keyword');
    const extraKeywords = (userKeywords || []).map((r: any) => r.keyword);
    console.log(`[User Keywords] Found ${extraKeywords.length} user-added keywords`);

    // Fetch Google Ads data for all keywords
    const trends = await fetchKeywordPlannerData(extraKeywords);
    const source = trends.length > 0 ? 'google_ads_api' : 'none';

    const redditPosts = await fetchRedditPosts();

    console.log(`Fetched ${trends.length} trends (${source}) and ${redditPosts.length} Reddit posts`);

    // Clear old data and insert new
    await supabase.from('funeral_trends').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('funeral_reddit_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (trends.length > 0) {
      // Insert in batches of 100 to avoid payload limits
      const BATCH = 100;
      for (let i = 0; i < trends.length; i += BATCH) {
        const batch = trends.slice(i, i + BATCH);
        const { error: trendsError } = await supabase.from('funeral_trends').insert(
          batch.map(t => ({
            keyword: t.keyword,
            volume: t.volume,
            change_percent: t.change_percent,
            sparkline: t.sparkline,
            category: t.category,
          }))
        );
        if (trendsError) console.error(`Error inserting trends batch ${i}:`, trendsError);
      }
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
        source,
        trends_count: trends.length,
        reddit_count: redditPosts.length,
        categories: Object.keys(KEYWORD_CATEGORIES).length,
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
