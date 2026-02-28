import { motion } from "framer-motion";
import { ArrowUp, MessageSquare, ExternalLink } from "lucide-react";
import type { RedditPost } from "@/lib/mockData";

interface RedditCardProps {
  post: RedditPost;
  index: number;
}

const sentimentColors = {
  positive: "bg-trend-up/10 text-trend-up",
  negative: "bg-trend-down/10 text-trend-down",
  neutral: "bg-muted text-muted-foreground",
};

const RedditCard = ({ post, index }: RedditCardProps) => {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4 }}
        className="glass-card p-4 hover:border-primary/30 transition-all group cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 pt-0.5">
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-mono text-foreground">{post.score >= 1000 ? `${(post.score / 1000).toFixed(1)}k` : post.score}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
              {post.title}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-primary font-medium">{post.subreddit}</span>
              <span className="text-xs text-muted-foreground">{post.timeAgo}</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span className="text-xs">{post.comments}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sentimentColors[post.sentiment]}`}>
                {post.sentiment}
              </span>
            </div>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
        </div>
      </motion.div>
    </a>
  );
};

export default RedditCard;
