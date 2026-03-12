import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, Loader2, Plus, X, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }, { code: "DC", name: "District of Columbia" },
];
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LocalResult {
  keyword: string;
  volume: number;
  change_percent: number;
  sparkline: number[];
  competition: string;
  competition_index: number;
}

const MiniSparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 28;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const competitionLabel = (comp: string) => {
  switch (comp) {
    case "HIGH": return { text: "High", className: "text-trend-down" };
    case "MEDIUM": return { text: "Medium", className: "text-yellow-500" };
    case "LOW": return { text: "Low", className: "text-trend-up" };
    default: return { text: "—", className: "text-muted-foreground" };
  }
};

const SUGGESTED_KEYWORDS = [
  "cremation cost",
  "funeral home near me",
  "green burial",
  "celebration of life",
  "pre-planning funeral",
  "direct cremation",
  "memorial service",
  "grief counseling",
];

const LocalTrends = () => {
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<LocalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<string | null>(null);

  const addKeyword = (kw?: string) => {
    const word = (kw || keywordInput).trim().toLowerCase();
    if (!word) return;
    if (keywords.length >= 10) {
      toast.error("Maximum 10 keywords allowed");
      return;
    }
    if (keywords.includes(word)) {
      toast.error("Keyword already added");
      return;
    }
    setKeywords((prev) => [...prev, word]);
    if (!kw) setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const handleSearch = async () => {
    if (!stateCode) {
      toast.error("Please select a state");
      return;
    }
    if (keywords.length === 0) {
      toast.error("Add at least one keyword to search");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    const stateName = US_STATES.find(s => s.code === stateCode)?.name || stateCode;

    try {
      const { data, error: fnError } = await supabase.functions.invoke("local-keyword-research", {
        body: { stateCode, stateName, keywords, city: city.trim() || undefined },
      });

      if (fnError) throw fnError;

      if (!data?.success) {
        setError(data?.error || "Search failed");
        return;
      }

      setResults(data.results || []);
      setSearchedLocation(data.locationLabel || stateName);

      if (data.results?.length === 0) {
        toast.info("No data found for these keywords in this state");
      }
    } catch (err: any) {
      console.error("Local research error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (keywordInput.trim()) {
        addKeyword();
      } else if (keywords.length > 0 && stateCode) {
        handleSearch();
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Local Keyword Research
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a US state and keywords to see real Google Ads search volume data for that region.
        </p>
      </motion.div>

      {/* Search Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 space-y-4"
      >
        {/* State & City Selection */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-shrink-0 sm:w-56">
            <Select value={stateCode} onValueChange={setStateCode}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-shrink-0 sm:w-48">
            <Input
              type="text"
              placeholder="City (optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Add a keyword and press Enter"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={100}
              className="pl-9"
            />
          </div>
          <Button onClick={() => addKeyword()} variant="outline" size="sm" className="h-10 gap-1 shrink-0">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {/* Keyword Chips */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {kw}
                <button onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <span className="text-xs text-muted-foreground self-center">
              {keywords.length}/10 keywords
            </span>
          </div>
        )}

        {/* Suggested Keywords */}
        {keywords.length === 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Suggested keywords:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => addKeyword(kw)}
                  className="px-2.5 py-1 rounded-full border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  + {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={loading || keywords.length === 0 || !stateCode}
          className="w-full sm:w-auto gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Search Local Trends
            </>
          )}
        </Button>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Results for {searchedLocation}
            </h2>
            <span className="text-xs text-muted-foreground">
              🇺🇸 {searchedLocation} · {results.length} keyword{results.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_80px_80px] gap-4 px-4 pb-2 text-xs text-muted-foreground font-medium border-b border-border">
            <span>Keyword</span>
            <span className="text-center">12-mo trend</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Change</span>
            <span className="text-right">Competition</span>
          </div>

          <div className="space-y-0.5">
            {results.map((result, i) => {
              const isUp = result.change_percent > 0;
              const isDown = result.change_percent < 0;
              const comp = competitionLabel(result.competition);

              return (
                <motion.div
                  key={result.keyword}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_80px_80px_80px] gap-1 sm:gap-4 items-start sm:items-center py-3 px-4 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <a
                      href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(result.keyword)}&geo=US`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-tertiary transition-colors hover:underline"
                    >
                      {result.keyword}
                    </a>
                  </div>
                  <div className="hidden sm:flex justify-center">
                    <MiniSparkline data={result.sparkline} />
                  </div>
                  <div className="sm:text-right">
                    <span className="text-sm font-mono text-foreground">
                      {result.volume.toLocaleString()}
                    </span>
                    <span className="sm:hidden text-xs text-muted-foreground ml-1">searches/mo</span>
                  </div>
                  <div className="flex items-center gap-1 sm:justify-end">
                    {isUp && <TrendingUp className="h-3.5 w-3.5 text-trend-up" />}
                    {isDown && <TrendingDown className="h-3.5 w-3.5 text-trend-down" />}
                    {!isUp && !isDown && <Minus className="h-3.5 w-3.5 text-trend-neutral" />}
                    <span
                      className={`text-xs font-mono ${
                        isUp ? "text-trend-up" : isDown ? "text-trend-down" : "text-trend-neutral"
                      }`}
                    >
                      {isUp ? "+" : ""}{result.change_percent}%
                    </span>
                  </div>
                  <div className={`text-xs font-medium sm:text-right ${comp.className}`}>
                    {comp.text}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state after search */}
      {!loading && results.length === 0 && searchedState && !error && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No search volume data found for these keywords in {searchedState}.
          <br />Try broader keywords or a different state.
        </div>
      )}
    </div>
  );
};

export default LocalTrends;
