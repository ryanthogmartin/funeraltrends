import { supabase } from "@/integrations/supabase/client";
import type { TrendItem, DashboardStats } from "@/lib/mockData";
import { mockTrends, mockStats } from "@/lib/mockData";

export async function fetchTrends(): Promise<TrendItem[]> {
  const { data, error } = await supabase
    .from('funeral_trends')
    .select('*')
    .order('volume', { ascending: false })
    .limit(24);

  if (error || !data || data.length === 0) {
    console.log('Using mock trends data');
    return mockTrends;
  }

  return data.map((row: any) => ({
    keyword: row.keyword,
    volume: row.volume,
    change: Number(row.change_percent),
    sparkline: row.sparkline || [],
  }));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: trends, error } = await supabase
    .from('funeral_trends')
    .select('volume, change_percent');

  if (error || !trends) return mockStats;

  const totalSearches = trends.reduce((sum: number, t: any) => sum + t.volume, 0);
  const trendingTopics = trends.filter((t: any) => Number(t.change_percent) > 0).length;

  return { totalSearches, trendingTopics };
}

export async function triggerDataRefresh(): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('fetch-funeral-data');
    return !error;
  } catch {
    return false;
  }
}
