import VideoTopics from "@/components/VideoTopics";
import RedditVideoTopics from "@/components/RedditVideoTopics";
import { mockTrends, mockRedditPosts } from "@/lib/mockData";
import { fetchTrends, fetchRedditPosts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const VideoIdeas = () => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Video Content Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-generated short-form video ideas based on trending topics and Reddit discussions.</p>
      </div>

      <VideoTopics
        trends={trends}
        isAuthenticated={!!user}
        onRequireAuth={() => navigate("/auth")}
      />

      <RedditVideoTopics
        posts={redditPosts}
        isAuthenticated={!!user}
        onRequireAuth={() => navigate("/auth")}
      />
    </div>
  );
};

export default VideoIdeas;
