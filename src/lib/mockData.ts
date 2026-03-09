export interface TrendItem {
  keyword: string;
  volume: number;
  change: number; // percentage
  sparkline: number[];
}

export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  score: number;
  comments: number;
  timeAgo: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DashboardStats {
  totalSearches: number;
  trendingTopics: number;
}

export const mockTrends: TrendItem[] = [
  { keyword: "green burial", volume: 12400, change: 34, sparkline: [20, 25, 30, 28, 35, 42, 55, 68, 72, 80, 85, 90] },
  { keyword: "cremation cost 2026", volume: 9800, change: 18, sparkline: [40, 42, 45, 50, 48, 55, 60, 58, 65, 70, 72, 75] },
  { keyword: "celebration of life ideas", volume: 8200, change: 22, sparkline: [30, 28, 35, 40, 45, 42, 50, 55, 60, 65, 68, 72] },
  { keyword: "water cremation", volume: 7500, change: 45, sparkline: [10, 12, 15, 20, 25, 30, 38, 45, 55, 65, 70, 80] },
  { keyword: "funeral pre-planning", volume: 6300, change: -5, sparkline: [60, 58, 55, 52, 50, 48, 52, 50, 48, 45, 47, 46] },
  { keyword: "biodegradable casket", volume: 5100, change: 62, sparkline: [5, 8, 12, 15, 20, 28, 35, 42, 50, 60, 68, 75] },
  { keyword: "memorial livestream", volume: 4800, change: -12, sparkline: [70, 65, 60, 55, 58, 52, 48, 45, 42, 40, 38, 35] },
  { keyword: "direct cremation near me", volume: 4200, change: 8, sparkline: [35, 38, 36, 40, 42, 38, 44, 42, 45, 48, 46, 50] },
];

export const mockRedditPosts: RedditPost[] = [
  {
    id: "1",
    title: "Has anyone done a green burial for a loved one? Looking for experiences and tips",
    subreddit: "r/funeral",
    score: 342,
    comments: 87,
    timeAgo: "3h ago",
    url: "#",
    sentiment: "positive",
  },
  {
    id: "2",
    title: "Water cremation (alkaline hydrolysis) is now legal in 28 states — why aren't more people talking about this?",
    subreddit: "r/DeathPositive",
    score: 1205,
    comments: 234,
    timeAgo: "5h ago",
    url: "#",
    sentiment: "positive",
  },
  {
    id: "3",
    title: "The funeral industry is charging $15k+ for basic services. When does it end?",
    subreddit: "r/personalfinance",
    score: 2891,
    comments: 567,
    timeAgo: "8h ago",
    url: "#",
    sentiment: "negative",
  },
  {
    id: "4",
    title: "We did a celebration of life instead of a traditional funeral and it was beautiful",
    subreddit: "r/GriefSupport",
    score: 890,
    comments: 112,
    timeAgo: "10h ago",
    url: "#",
    sentiment: "positive",
  },
  {
    id: "5",
    title: "Biodegradable mushroom suit caskets — the future of eco-friendly burial?",
    subreddit: "r/Futurology",
    score: 1567,
    comments: 189,
    timeAgo: "12h ago",
    url: "#",
    sentiment: "neutral",
  },
  {
    id: "6",
    title: "Pre-planning my own funeral at 35. Anyone else doing this?",
    subreddit: "r/DeathPositive",
    score: 456,
    comments: 78,
    timeAgo: "16h ago",
    url: "#",
    sentiment: "neutral",
  },
];

export const mockStats: DashboardStats = {
  totalSearches: 58300,
  trendingTopics: 24,
};
