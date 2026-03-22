import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, RefreshCw, Plus, X, Trash2, Globe, Lock, Users, Database, User } from "lucide-react";
import TrendRow from "./TrendRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KEYWORD_CATEGORIES } from "@/lib/keywordCategories";
import type { TrendItem } from "@/lib/mockData";
import type { UserKeyword } from "@/lib/api";
import { addUserKeyword, removeUserKeyword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface GoogleTrendsSectionProps {
  trends: TrendItem[];
  handleAddToWatchlist: (keyword: string) => void;
  isAddingToWatchlist: boolean;
  addingKeyword?: string;
  onRefreshKeywords?: () => void;
  isRefreshingKeywords?: boolean;
  userId?: string;
  userKeywords?: UserKeyword[];
  communityKeywords?: UserKeyword[];
}

type ViewMode = "master" | "mine" | "community";

const INITIAL_COUNT = 15;

const GoogleTrendsSection = ({
  trends,
  handleAddToWatchlist,
  isAddingToWatchlist,
  addingKeyword,
  onRefreshKeywords,
  isRefreshingKeywords,
  userId,
  userKeywords = [],
  communityKeywords = []
}: GoogleTrendsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("master");
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("custom");
  const [isPublic, setIsPublic] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build the visible list based on view mode
  const filteredTrends = useMemo(() => {
    let list: TrendItem[] = [];

    if (viewMode === "master") {
      list = trends;
    } else if (viewMode === "mine") {
      const myKeywordSet = new Set(userKeywords.map((k) => k.keyword.toLowerCase()));
      list = trends.filter((t) => myKeywordSet.has(t.keyword.toLowerCase()));
      // Also show user keywords that don't have trend data yet
      for (const uk of userKeywords) {
        if (!list.find((t) => t.keyword.toLowerCase() === uk.keyword.toLowerCase())) {
          list.push({ keyword: uk.keyword, volume: 0, change: 0, sparkline: [], category: uk.category, source: "user" });
        }
      }
    } else if (viewMode === "community") {
      const communityKeywordSet = new Set(communityKeywords.map((k) => k.keyword.toLowerCase()));
      list = trends.filter((t) => communityKeywordSet.has(t.keyword.toLowerCase()));
      for (const ck of communityKeywords) {
        if (!list.find((t) => t.keyword.toLowerCase() === ck.keyword.toLowerCase())) {
          list.push({ keyword: ck.keyword, volume: 0, change: 0, sparkline: [], category: ck.category, source: "community" });
        }
      }
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      list = list.filter((t) => (t.category || "general") === selectedCategory);
    }

    return list;
  }, [trends, viewMode, selectedCategory, userKeywords, communityKeywords]);

  const visibleTrends = expanded ? filteredTrends : filteredTrends.slice(0, INITIAL_COUNT);

  // Count keywords per category for master list
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: trends.length };
    for (const t of trends) {
      const cat = t.category || "general";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [trends]);

  const handleAddKeyword = async () => {
    if (!userId) {
      toast({ title: "Sign in required", description: "You need to be signed in to add keywords", variant: "destructive" });
      return;
    }
    if (!newKeyword.trim()) return;
    if (userKeywords.length >= 25) {
      toast({ title: "Limit reached", description: "You can track up to 25 custom keywords", variant: "destructive" });
      return;
    }

    setIsAdding(true);
    const success = await addUserKeyword(userId, newKeyword, newCategory, isPublic);
    if (success) {
      toast({ title: "Keyword added!", description: `"${newKeyword}" will be tracked on next refresh` });
      setNewKeyword("");
      queryClient.invalidateQueries({ queryKey: ["user-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["community-keywords"] });
    } else {
      toast({ title: "Failed to add", description: "Keyword may already exist", variant: "destructive" });
    }
    setIsAdding(false);
  };

  const handleRemoveKeyword = async (id: string) => {
    const success = await removeUserKeyword(id);
    if (success) {
      toast({ title: "Keyword removed" });
      queryClient.invalidateQueries({ queryKey: ["user-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["community-keywords"] });
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="lg:col-span-3 glass-card p-5">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-display font-semibold text-foreground">
          Google Keyword Tool — Funeral Searches
        </h2>
        <div className="flex items-center gap-2">
          {onRefreshKeywords &&
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshKeywords}
            disabled={isRefreshingKeywords}
            className="gap-1.5 text-xs">
            
              <RefreshCw className={`h-3 w-3 ${isRefreshingKeywords ? "animate-spin" : ""}`} />
              {isRefreshingKeywords ? "Refreshing…" : "Refresh Keywords"}
            </Button>
          }
          <span className="text-xs text-muted-foreground">🇺🇸 United States · 30 Days</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        225 of the top searched funeral-related keywords across 15 categories. Track search volume, add your own keywords, and see what the community is monitoring.
      </p>

      {/* View Mode Toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("master")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            viewMode === "master" ?
            "bg-primary text-primary-foreground" :
            "bg-background text-muted-foreground hover:text-foreground"}`
            }>
            
            <Database className="h-3 w-3" />
            Master List ({trends.length})
          </button>
          <button
            onClick={() => setViewMode("mine")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
            viewMode === "mine" ?
            "bg-primary text-primary-foreground" :
            "bg-background text-muted-foreground hover:text-foreground"}`
            }>
            
            <User className="h-3 w-3" />
            My Keywords ({userKeywords.length})
          </button>
          <button
            onClick={() => setViewMode("community")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
            viewMode === "community" ?
            "bg-primary text-primary-foreground" :
            "bg-background text-muted-foreground hover:text-foreground"}`
            }>
            
            <Users className="h-3 w-3" />
            Community ({communityKeywords.length})
          </button>
        </div>
      </div>

      {/* Category Filter Dropdown */}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-muted-foreground">Category:</label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-8 w-[240px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories ({categoryCounts.all || 0})</SelectItem>
            {KEYWORD_CATEGORIES.map((cat) =>
            <SelectItem key={cat.id} value={cat.id}>
                {cat.emoji} {cat.label} ({categoryCounts[cat.id] || 0})
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Add Keyword Form (visible when in "mine" mode or always for logged in users) */}
      {userId && (viewMode === "mine" || viewMode === "master") &&
      <div className="flex flex-wrap items-end gap-2 mb-4 p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Add a keyword to track</label>
            <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="e.g. memorial service ideas"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()} />
          
          </div>
          <div className="w-[160px]">
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {KEYWORD_CATEGORIES.map((c) =>
              <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </SelectItem>
              )}
              </SelectContent>
            </Select>
          </div>
          <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPublic(!isPublic)}
          className="h-8 gap-1 text-xs"
          title={isPublic ? "Visible to community" : "Private keyword"}>
          
            {isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {isPublic ? "Public" : "Private"}
          </Button>
          <Button
          size="sm"
          onClick={handleAddKeyword}
          disabled={isAdding || !newKeyword.trim()}
          className="h-8 gap-1 text-xs">
          
            <Plus className="h-3 w-3" />
            Add ({userKeywords.length}/25)
          </Button>
        </div>
      }

      {/* Keywords List */}
      <div className="space-y-0.5">
        {visibleTrends.map((trend, i) =>
        <div key={`${trend.keyword}-${i}`} className="flex items-center">
            <div className="flex-1">
              <TrendRow
              trend={trend}
              index={i}
              rank={i + 1}
              onAddToWatchlist={handleAddToWatchlist}
              isAddingToWatchlist={isAddingToWatchlist}
              addingKeyword={addingKeyword} />
            
            </div>
            {/* Show remove button for user's own keywords */}
            {viewMode === "mine" && userId &&
          (() => {
            const uk = userKeywords.find((k) => k.keyword.toLowerCase() === trend.keyword.toLowerCase());
            return uk ?
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveKeyword(uk.id)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0">
              
                    <Trash2 className="h-3 w-3" />
                  </Button> :
            null;
          })()
          }
          </div>
        )}
        {filteredTrends.length === 0 &&
        <div className="text-center py-8 text-muted-foreground text-sm">
            {viewMode === "mine" ?
          "You haven't added any custom keywords yet. Use the form above to start tracking!" :
          viewMode === "community" ?
          "No community keywords yet. Keywords added by other users will appear here." :
          "No keywords found for this category."}
          </div>
        }
      </div>

      {filteredTrends.length > INITIAL_COUNT &&
      <div className="mt-3 text-center">
          <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary">
          
            {expanded ?
          <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show Less
              </> :

          <>
                <ChevronDown className="h-3.5 w-3.5" />
                See All {filteredTrends.length} Keywords
              </>
          }
          </Button>
        </div>
      }
    </motion.section>);

};

export default GoogleTrendsSection;