const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Google Ads OAuth ──────────────────────────────────────────────────

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

// ─── Geo Target Lookup ─────────────────────────────────────────────────

async function lookupGeoTarget(accessToken: string, zipCode: string): Promise<string | null> {
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID')!;
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID')!;
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN')!;

  const url = `https://googleads.googleapis.com/v21/geoTargetConstants:suggest`;

  const body = {
    locale: 'en',
    countryCode: 'US',
    locationNames: {
      names: [zipCode],
    },
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
    console.error(`Geo target lookup error ${res.status}: ${errText}`);
    return null;
  }

  const data = await res.json();
  const results = data.geoTargetConstantSuggestions || [];

  if (results.length === 0) {
    console.log(`No geo target found for zip code: ${zipCode}`);
    return null;
  }

  // Return the resource name (e.g., "geoTargetConstants/123456")
  const resourceName = results[0].geoTargetConstant?.resourceName;
  const canonicalName = results[0].geoTargetConstant?.canonicalName || zipCode;
  console.log(`Resolved zip ${zipCode} → ${resourceName} (${canonicalName})`);

  return resourceName || null;
}

// ─── Keyword Research ──────────────────────────────────────────────────

async function fetchLocalKeywordData(
  accessToken: string,
  keywords: string[],
  geoTargetConstant: string,
): Promise<any[]> {
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID')!;
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID')!;
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN')!;

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}:generateKeywordHistoricalMetrics`;

  const body = {
    keywords,
    language: 'languageConstants/1000',
    geoTargetConstants: [geoTargetConstant],
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
  const trends: any[] = [];

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

    trends.push({
      keyword,
      volume: avgSearches,
      change_percent: changePercent,
      sparkline: monthlyVolumes,
      competition: metrics.competition || 'UNSPECIFIED',
      competition_index: parseInt(metrics.competitionIndex) || 0,
    });
  }

  return trends.sort((a, b) => b.volume - a.volume);
}

// ─── Main Handler ──────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode, keywords } = await req.json();

    if (!zipCode || typeof zipCode !== 'string' || !/^\d{5}$/.test(zipCode.trim())) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide a valid 5-digit US zip code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0 || keywords.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide 1-10 keywords' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Sanitize keywords
    const cleanKeywords = keywords
      .map((k: any) => String(k).trim().slice(0, 100))
      .filter((k: string) => k.length > 0);

    if (cleanKeywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid keywords provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
    const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
    const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID');
    const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN');

    if (!clientId || !clientSecret || !refreshToken || !customerId || !managerCustomerId || !developerToken) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Ads API is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(`[Local Research] Zip: ${zipCode.trim()}, Keywords: ${cleanKeywords.join(', ')}`);

    const accessToken = await getAccessToken();

    // Look up geo target for the zip code
    const geoTarget = await lookupGeoTarget(accessToken, zipCode.trim());

    if (!geoTarget) {
      return new Response(
        JSON.stringify({ success: false, error: `Could not find location data for zip code ${zipCode.trim()}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Fetch keyword data for that location
    const results = await fetchLocalKeywordData(accessToken, cleanKeywords, geoTarget);

    console.log(`[Local Research] Returned ${results.length} keyword results for ${zipCode.trim()}`);

    return new Response(
      JSON.stringify({
        success: true,
        zipCode: zipCode.trim(),
        geoTarget,
        results,
        fetched_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Error in local-keyword-research:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
