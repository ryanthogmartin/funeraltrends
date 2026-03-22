import VideoTopics from "@/components/VideoTopics";
import CustomKeywordTopics from "@/components/CustomKeywordTopics";
import QuestionSeriesGenerator from "@/components/QuestionSeriesGenerator";
import FacebookInsights from "@/components/FacebookInsights";
import ReelsInsights from "@/components/ReelsInsights";
import { mockTrends } from "@/lib/mockData";
import { fetchTrends } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const VideoIdeas = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = loading || !!user;

  const { data: trends = mockTrends } = useQuery({
    queryKey: ['funeral-trends'],
    queryFn: fetchTrends,
    staleTime: 1000 * 60 * 5
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Video Content Ideas</h1>
        <p className="text-sm text-muted-foreground mt-1">Use the custom features below to build custom AI-generated short-form video ideas with scripts.    </p>
      </div>

      <QuestionSeriesGenerator
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => navigate("/auth")} />
      

      <CustomKeywordTopics
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => navigate("/auth")} />
      

      <VideoTopics
        trends={trends}
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => navigate("/auth")} />
      

      <FacebookInsights
        trends={trends}
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => navigate("/auth")} />
      

      <ReelsInsights
        trends={trends}
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => navigate("/auth")} />
      
    </div>);

};

export default VideoIdeas;