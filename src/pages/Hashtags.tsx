import HashtagTracker from "@/components/HashtagTracker";
import InstagramHashtagTracker from "@/components/InstagramHashtagTracker";
import { mockTrends } from "@/lib/mockData";
import { fetchTrends } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const Hashtags = () => {
  const { data: trends = mockTrends } = useQuery({
    queryKey: ['funeral-trends'],
    queryFn: fetchTrends,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Hashtag Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-suggested hashtags for TikTok and Instagram with growth tracking.</p>
      </div>

      <HashtagTracker trends={trends} />
      <InstagramHashtagTracker trends={trends} />
    </div>
  );
};

export default Hashtags;
