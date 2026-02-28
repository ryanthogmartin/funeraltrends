import { Search, TrendingUp, MessageSquare, Heart } from "lucide-react";
import DashboardHeader from "@/components/DashboardHeader";
import StatCard from "@/components/StatCard";
import TrendRow from "@/components/TrendRow";
import RedditCard from "@/components/RedditCard";
import { mockTrends, mockRedditPosts, mockStats } from "@/lib/mockData";
import { motion } from "framer-motion";

const Index = () => {
  const stats = [
    {
      label: "Total Searches",
      value: mockStats.totalSearches.toLocaleString(),
      icon: Search,
      detail: "Across all tracked keywords",
    },
    {
      label: "Trending Topics",
      value: mockStats.trendingTopics.toString(),
      icon: TrendingUp,
      detail: "Up from 18 yesterday",
    },
    {
      label: "Reddit Mentions",
      value: mockStats.redditMentions.toLocaleString(),
      icon: MessageSquare,
      detail: "Across 12 subreddits",
    },
    {
      label: "Avg. Sentiment",
      value: `${Math.round(mockStats.avgSentiment * 100)}%`,
      icon: Heart,
      detail: "Positive sentiment score",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader lastUpdated="2 min ago" />

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
              {mockTrends.map((trend, i) => (
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
              {mockRedditPosts.map((post, i) => (
                <RedditCard key={post.id} post={post} index={i} />
              ))}
            </div>
          </motion.section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Data refreshes daily · Mock data shown · Connect Lovable Cloud for live feeds
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
