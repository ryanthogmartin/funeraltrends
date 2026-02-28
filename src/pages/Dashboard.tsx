import { Search, TrendingUp, MessageSquare, Heart, LogIn } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import GoogleTrendsSection from "@/components/GoogleTrendsSection";
import RedditCard from "@/components/RedditCard";
import KeywordWatchlist from "@/components/KeywordWatchlist";
import FacebookInsights from "@/components/FacebookInsights";
import { mockTrends, mockRedditPosts, mockStats } from "@/lib/mockData";
import { fetchTrends, fetchRedditPosts, fetchDashboardStats, triggerDataRefresh } from "@/lib/api";
import { exportTrendsCsv } from "@/lib/exportCsv";
import { motion } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    toast({ title: "Refreshing data...", description: "Fetching latest funeral trends" });
    const success = await triggerDataRefresh();
    if (success) {
      await queryClient.invalidateQueries({ queryKey: ['funeral-trends'] });
      await queryClient.invalidateQueries({ queryKey: ['funeral-reddit'] });
      await queryClient.invalidateQueries({ queryKey: ['funeral-stats'] });
      toast({ title: "Data refreshed!" });
    } else {
      toast({ title: "Refresh failed", description: "Using cached data.", variant: "destructive" });
    }
    setIsRefreshing(false);
  };

  const addToWatchlist = useMutation({
    mutationFn: async (keyword: string) => {
      if (!user) { navigate("/auth"); return; }
      setAddingKeyword(keyword);
      const { error } = await supabase.from("keyword_watchlist").insert({ user_id: user.id, keyword: keyword.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keyword-watchlist"] });
      toast({ title: "Added to watchlist!" });
      setAddingKeyword(null);
    },
    onError: (err: any) => {
      toast({ title: "Failed to add", description: err.message?.includes("duplicate") ? "Already in your watchlist" : err.message, variant: "destructive" });
      setAddingKeyword(null);
    },
  });

  const handleAddToWatchlist = (keyword: string) => {
    if (!user) { navigate("/auth"); return; }
    addToWatchlist.mutate(keyword);
  };

  const stats = [
    { label: "Total Searches", value: dashStats.totalSearches.toLocaleString(), icon: Search, detail: "Across all tracked keywords" },
    { label: "Trending Topics", value: dashStats.trendingTopics.toString(), icon: TrendingUp, detail: "Keywords trending up" },
    { label: "Reddit Mentions", value: dashStats.redditMentions.toLocaleString(), icon: MessageSquare, detail: "Total upvotes across posts" },
    { label: "Avg. Sentiment", value: `${Math.round(dashStats.avgSentiment * 100)}%`, icon: Heart, detail: "Positive sentiment score" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardHeader
        lastUpdated={isRefreshing ? "refreshing..." : "recently"}
        onRefresh={handleRefresh}
        onExportCsv={() => exportTrendsCsv(trends, redditPosts)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      <TrendChart trends={trends} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <GoogleTrendsSection
          trends={trends}
          handleAddToWatchlist={handleAddToWatchlist}
          isAddingToWatchlist={addToWatchlist.isPending}
          addingKeyword={addingKeyword || undefined}
        />

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Reddit Discussions</h2>
            <span className="text-xs text-muted-foreground">Trending now</span>
          </div>
          <div className="space-y-3">
            {redditPosts.map((post, i) => (
              <RedditCard key={post.id} post={post} index={i} />
            ))}
          </div>
        </motion.section>
      </div>

      <FacebookInsights
        trends={trends}
        isAuthenticated={!!user}
        onRequireAuth={() => navigate("/auth")}
      />

      {user && <KeywordWatchlist userId={user.id} trends={trends} />}

      {!user && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-panel mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">Sign in to save keywords to your watchlist and get spike alerts</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="gap-1.5 border-primary/30 text-primary">
            <LogIn className="h-3.5 w-3.5" /> Sign In to Enable Watchlist
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
