const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GOOGLE_ADS_API_VERSION = 'v19';

interface KeywordMetrics {
  keyword: string;
  avgMonthlySearches: number;
  competition: string;
  competitionIndex: number;
  monthlySearchVolumes: { month: string; year: number; searches: number }[];
}

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
    throw new Error(`Failed to get access token: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchHistoricalMetrics(
  accessToken: string,
  keywords: string[],
): Promise<KeywordMetrics[]> {
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID')!;
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID')!;
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN')!;

  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const body = {
    keywords,
    language: 'languageConstants/1000', // English
    geoTargetConstants: ['geoTargetConstants/2840'], // US
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
    throw new Error(`Google Ads API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const results: KeywordMetrics[] = [];

  for (const result of (data.results || [])) {
    const text = result.text || '';
    const metrics = result.keywordMetrics || {};

    const monthlyVolumes = (metrics.monthlySearchVolumes || []).map((m: any) => ({
      month: m.month || '',
      year: parseInt(m.year) || 0,
      searches: parseInt(m.monthlySearches) || 0,
    }));

    results.push({
      keyword: text,
      avgMonthlySearches: parseInt(metrics.avgMonthlySearches) || 0,
      competition: metrics.competition || 'UNSPECIFIED',
      competitionIndex: parseInt(metrics.competitionIndex) || 0,
      monthlySearchVolumes: monthlyVolumes,
    });
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return new Response(
        JSON.stringify({ error: 'keywords array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Google Ads API supports max 10,000 keywords but we batch in groups of 200
    const BATCH_SIZE = 200;
    const allMetrics: KeywordMetrics[] = [];

    console.log(`Fetching metrics for ${keywords.length} keywords...`);
    const accessToken = await getAccessToken();

    for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
      const batch = keywords.slice(i, i + BATCH_SIZE);
      const metrics = await fetchHistoricalMetrics(accessToken, batch);
      allMetrics.push(...metrics);
    }

    console.log(`Got metrics for ${allMetrics.length} keywords`);

    return new Response(
      JSON.stringify({ results: allMetrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in google-ads-keywords:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
