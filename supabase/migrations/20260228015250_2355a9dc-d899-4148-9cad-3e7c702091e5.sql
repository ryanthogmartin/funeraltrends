
-- Table for Google Trends funeral keywords
CREATE TABLE public.funeral_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  volume INTEGER NOT NULL DEFAULT 0,
  change_percent NUMERIC NOT NULL DEFAULT 0,
  sparkline JSONB DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for Reddit funeral discussions
CREATE TABLE public.funeral_reddit_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reddit_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  num_comments INTEGER NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  posted_at TIMESTAMP WITH TIME ZONE,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Both tables are public read (dashboard is public-facing)
ALTER TABLE public.funeral_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_reddit_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read funeral trends" ON public.funeral_trends FOR SELECT USING (true);
CREATE POLICY "Anyone can read reddit posts" ON public.funeral_reddit_posts FOR SELECT USING (true);

-- Service role can insert/update/delete (edge functions use service role)
CREATE POLICY "Service role can manage trends" ON public.funeral_trends FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage reddit posts" ON public.funeral_reddit_posts FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_funeral_trends_fetched_at ON public.funeral_trends (fetched_at DESC);
CREATE INDEX idx_funeral_reddit_posts_fetched_at ON public.funeral_reddit_posts (fetched_at DESC);
