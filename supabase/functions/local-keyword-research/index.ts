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

// ─── State Geo Target Constants ────────────────────────────────────────
const STATE_GEO_TARGETS: Record<string, string> = {
  AL: "geoTargetConstants/21133", AK: "geoTargetConstants/21132",
  AZ: "geoTargetConstants/21136", AR: "geoTargetConstants/21135",
  CA: "geoTargetConstants/21137", CO: "geoTargetConstants/21138",
  CT: "geoTargetConstants/21139", DE: "geoTargetConstants/21141",
  FL: "geoTargetConstants/21142", GA: "geoTargetConstants/21143",
  HI: "geoTargetConstants/21144", ID: "geoTargetConstants/21145",
  IL: "geoTargetConstants/21146", IN: "geoTargetConstants/21147",
  IA: "geoTargetConstants/21148", KS: "geoTargetConstants/21149",
  KY: "geoTargetConstants/21150", LA: "geoTargetConstants/21151",
  ME: "geoTargetConstants/21152", MD: "geoTargetConstants/21154",
  MA: "geoTargetConstants/21153", MI: "geoTargetConstants/21155",
  MN: "geoTargetConstants/21156", MS: "geoTargetConstants/21157",
  MO: "geoTargetConstants/21158", MT: "geoTargetConstants/21159",
  NE: "geoTargetConstants/21160", NV: "geoTargetConstants/21161",
  NH: "geoTargetConstants/21162", NJ: "geoTargetConstants/21163",
  NM: "geoTargetConstants/21164", NY: "geoTargetConstants/21167",
  NC: "geoTargetConstants/21165", ND: "geoTargetConstants/21166",
  OH: "geoTargetConstants/21168", OK: "geoTargetConstants/21169",
  OR: "geoTargetConstants/21170", PA: "geoTargetConstants/21171",
  RI: "geoTargetConstants/21172", SC: "geoTargetConstants/21173",
  SD: "geoTargetConstants/21174", TN: "geoTargetConstants/21175",
  TX: "geoTargetConstants/21176", UT: "geoTargetConstants/21177",
  VT: "geoTargetConstants/21178", VA: "geoTargetConstants/21179",
  WA: "geoTargetConstants/21180", WV: "geoTargetConstants/21181",
  WI: "geoTargetConstants/21182", WY: "geoTargetConstants/21183",
  DC: "geoTargetConstants/21140",
};

// ─── Resolve City Geo Target ──────────────────────────────────────────

async function resolveCityGeoTarget(
  accessToken: string,
  cityName: string,
  stateCode: string,
): Promise<string | null> {
  const developerToken = Deno.env.get('GOOOGLE_ADS_DEVELOPER_TOKEN')!;
  const managerCustomerId = Deno.env.get('GOOGLE_ADS_MANAGER_CUSTOMER_ID')!;

  const searchQuery = `${cityName}, ${stateCode}`;

  const res = await fetch('https://googleads.googleapis.com/v21/geoTargetConstants:suggest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': managerCustomerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locale: 'en',
      countryCode: 'US',
      locationNames: { names: [searchQuery] },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Geo suggest error ${res.status}: ${errText}`);
    return null;
  }

  const data = await res.json();
  const suggestions = data.geoTargetConstantSuggestions || [];

  // Find a City-type match
  for (const s of suggestions) {
    const gtc = s.geoTargetConstant;
    if (gtc && gtc.targetType === 'City') {
      console.log(`Resolved city "${searchQuery}" → ${gtc.resourceName} (${gtc.canonicalName})`);
      return gtc.resourceName;
    }
  }

  // Fallback: take the first result regardless of type
  if (suggestions.length > 0 && suggestions[0].geoTargetConstant) {
    const gtc = suggestions[0].geoTargetConstant;
    console.log(`Resolved "${searchQuery}" → ${gtc.resourceName} (${gtc.canonicalName}) [type: ${gtc.targetType}]`);
    return gtc.resourceName;
  }

  console.warn(`No geo target found for "${searchQuery}"`);
  return null;
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
    const { stateCode, stateName, keywords, city } = await req.json();

    if (!stateCode || typeof stateCode !== 'string' || stateCode.length !== 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please select a valid US state' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stateGeoTarget = STATE_GEO_TARGETS[stateCode.toUpperCase()];
    if (!stateGeoTarget) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown state code: ${stateCode}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0 || keywords.length > 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please provide 1-10 keywords' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cleanKeywords = keywords
      .map((k: any) => String(k).trim().slice(0, 100))
      .filter((k: string) => k.length > 0);

    if (cleanKeywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid keywords provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cleanCity = city ? String(city).trim().slice(0, 100) : '';

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

    const accessToken = await getAccessToken();

    // Resolve geo target: city if provided, otherwise state
    let geoTarget = stateGeoTarget;
    let locationLabel = stateName || stateCode;

    if (cleanCity) {
      console.log(`[Local Research] Resolving city: "${cleanCity}" in ${stateCode}`);
      const cityGeoTarget = await resolveCityGeoTarget(accessToken, cleanCity, stateCode);
      if (cityGeoTarget) {
        geoTarget = cityGeoTarget;
        locationLabel = `${cleanCity}, ${stateName || stateCode}`;
      } else {
        console.warn(`City "${cleanCity}" not found, falling back to state ${stateCode}`);
        locationLabel = `${stateName || stateCode} (city not found, using state)`;
      }
    }

    console.log(`[Local Research] Location: ${locationLabel}, Keywords: ${cleanKeywords.join(', ')}, GeoTarget: ${geoTarget}`);

    const results = await fetchLocalKeywordData(accessToken, cleanKeywords, geoTarget);

    console.log(`[Local Research] Returned ${results.length} keyword results`);

    return new Response(
      JSON.stringify({
        success: true,
        stateCode: stateCode.toUpperCase(),
        stateName: stateName || stateCode,
        city: cleanCity || null,
        locationLabel,
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
