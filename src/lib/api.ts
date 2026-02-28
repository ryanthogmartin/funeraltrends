import { supabase } from "@/integrations/supabase/client";
import type { TrendItem, RedditPost, DashboardStats } from "@/lib/mockData";
import { mockTrends, mockRedditPosts, mockStats } from "@/lib/mockData";

export async function fetchTrends(): Promise<TrendItem[]> {
  const { data, error } = await supabase
    .from('funeral_trends')
    .select('*')
    .order('volume', { ascending: false })
    .limit(12);

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

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const { data, error } = await supabase
    .from('funeral_reddit_posts')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) {
    console.log('Using mock reddit data');
    return mockRedditPosts;
  }

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    subreddit: row.subreddit,
    score: row.score,
    comments: row.num_comments,
    timeAgo: getTimeAgo(row.posted_at),
    url: row.url,
    sentiment: row.sentiment as 'positive' | 'negative' | 'neutral',
  }));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [trendsRes, redditRes] = await Promise.all([
    supabase.from('funeral_trends').select('volume, change_percent'),
    supabase.from('funeral_reddit_posts').select('score, sentiment'),
  ]);

  if (!trendsRes.data?.length || !redditRes.data?.length) {
    return mockStats;
  }

  const totalSearches = trendsRes.data.reduce((sum: number, t: any) => sum + t.volume, 0);
  const trendingTopics = trendsRes.data.filter((t: any) => Number(t.change_percent) > 0).length;
  const redditMentions = redditRes.data.reduce((sum: number, p: any) => sum + p.score, 0);
  const positiveCount = redditRes.data.filter((p: any) => p.sentiment === 'positive').length;
  const avgSentiment = positiveCount / redditRes.data.length;

  return { totalSearches, trendingTopics, redditMentions, avgSentiment };
}

export async function triggerDataRefresh(): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('fetch-funeral-data');
    return !error;
  } catch {
    return false;
  }
}

function getTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'recently';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffHours = Math.floor((now - then) / (1000 * 60 * 60));
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}
