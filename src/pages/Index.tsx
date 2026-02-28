import { Search, TrendingUp, MessageSquare, Heart, RefreshCw, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import TrendRow from "@/components/TrendRow";
import RedditCard from "@/components/RedditCard";
import { mockTrends, mockRedditPosts, mockStats } from "@/lib/mockData";
import { fetchTrends, fetchRedditPosts, fetchDashboardStats, triggerDataRefresh } from "@/lib/api";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: trends = mockTrends } = useQuery({
    queryKey: ['funeral-trends'],
    queryFn: fetchTrends,
    staleTime: 1000 * 60 * 5,
  });

  const { data: redditPosts = mockRedditPosts } = useQuery({
    queryKey: ['funeral-reddit'],
    queryFn: fetchRedditPosts,
    staleTime: 1000 * 60 * 5,
  });

  const { data: dashStats = mockStats } = useQuery({
    queryKey: ['funeral-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 1000 * 60 * 5,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast({ title: "Refreshing data...", description: "Fetching latest funeral trends from Google & Reddit" });
    
    const success = await triggerDataRefresh();
    
    if (success) {
      await queryClient.invalidateQueries({ queryKey: ['funeral-trends'] });
      await queryClient.invalidateQueries({ queryKey: ['funeral-reddit'] });
      await queryClient.invalidateQueries({ queryKey: ['funeral-stats'] });
      toast({ title: "Data refreshed!", description: "Dashboard updated with latest trends" });
    } else {
      toast({ title: "Refresh failed", description: "Using cached data. Try again later.", variant: "destructive" });
    }
    
    setIsRefreshing(false);
  };

  const stats = [
    {
      label: "Total Searches",
      value: dashStats.totalSearches.toLocaleString(),
      icon: Search,
      detail: "Across all tracked keywords",
    },
    {
      label: "Trending Topics",
      value: dashStats.trendingTopics.toString(),
      icon: TrendingUp,
      detail: "Keywords trending up",
    },
    {
      label: "Reddit Mentions",
      value: dashStats.redditMentions.toLocaleString(),
      icon: MessageSquare,
      detail: "Total upvotes across posts",
    },
    {
      label: "Avg. Sentiment",
      value: `${Math.round(dashStats.avgSentiment * 100)}%`,
      icon: Heart,
      detail: "Positive sentiment score",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader lastUpdated={isRefreshing ? "refreshing..." : "recently"} onRefresh={handleRefresh} />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} index={i} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Google Trends */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-3 glass-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Google Trends — Funeral Searches
              </h2>
              <span className="text-xs text-muted-foreground">Past 24h</span>
            </div>
            <div className="space-y-0.5">
              {trends.map((trend, i) => (
                <TrendRow key={trend.keyword} trend={trend} index={i} rank={i + 1} />
              ))}
            </div>
          </motion.section>

          {/* Reddit */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-semibold text-foreground">
                Reddit Discussions
              </h2>
              <span className="text-xs text-muted-foreground">Trending now</span>
            </div>
            <div className="space-y-3">
              {redditPosts.map((post, i) => (
                <RedditCard key={post.id} post={post} index={i} />
              ))}
            </div>
          </motion.section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Data refreshes daily · Click Refresh to fetch latest data
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
