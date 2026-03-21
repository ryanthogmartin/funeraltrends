import { supabase } from "@/integrations/supabase/client";
import type { TrendItem, DashboardStats } from "@/lib/mockData";
import { mockTrends, mockStats } from "@/lib/mockData";

export async function fetchTrends(): Promise<TrendItem[]> {
  const { data, error } = await supabase
    .from('funeral_trends')
    .select('*')
    .order('volume', { ascending: false });

  if (error || !data || data.length === 0) {
    console.log('Using mock trends data');
    return mockTrends;
  }

  return data.map((row: any) => ({
    keyword: row.keyword,
    volume: row.volume,
    change: Number(row.change_percent),
    sparkline: row.sparkline || [],
    category: (row as any).category || 'general',
  }));
}

export interface UserKeyword {
  id: string;
  keyword: string;
  category: string;
  is_public: boolean;
  user_id: string;
  created_at: string;
}

export async function fetchUserKeywords(userId: string): Promise<UserKeyword[]> {
  const { data, error } = await supabase
    .from('user_keywords')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as UserKeyword[];
}

export async function fetchCommunityKeywords(userId: string): Promise<UserKeyword[]> {
  const { data, error } = await supabase
    .from('user_keywords')
    .select('*')
    .eq('is_public', true)
    .neq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as UserKeyword[];
}

export async function addUserKeyword(userId: string, keyword: string, category: string = 'custom', isPublic: boolean = true): Promise<boolean> {
  const { error } = await supabase.from('user_keywords').insert({
    user_id: userId,
    keyword: keyword.trim(),
    category,
    is_public: isPublic,
  });
  return !error;
}

export async function removeUserKeyword(id: string): Promise<boolean> {
  const { error } = await supabase.from('user_keywords').delete().eq('id', id);
  return !error;
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

export interface TrendSignal {
  id: string;
  signal_type: string;
  title: string;
  summary: string;
  relevance_score: number;
  source: string;
  source_urls: string[];
  related_keywords: string[];
  fetched_at: string;
}

export async function fetchTrendSignals(): Promise<TrendSignal[]> {
  const { data, error } = await supabase
    .from('trend_signals')
    .select('*')
    .order('relevance_score', { ascending: false })
    .limit(15);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    signal_type: row.signal_type,
    title: row.title,
    summary: row.summary,
    relevance_score: row.relevance_score,
    source: row.source,
    source_urls: row.source_urls || [],
    related_keywords: row.related_keywords || [],
    fetched_at: row.fetched_at,
  }));
}

export async function triggerTrendSignalsRefresh(): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('detect-trend-signals');
    return !error;
  } catch {
    return false;
  }
}
