
CREATE TABLE public.keyword_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_volume INTEGER DEFAULT 0,
  last_change_percent NUMERIC DEFAULT 0,
  spiked BOOLEAN DEFAULT false,
  UNIQUE(user_id, keyword)
);

ALTER TABLE public.keyword_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own watchlist" ON public.keyword_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist" ON public.keyword_watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist" ON public.keyword_watchlist
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist" ON public.keyword_watchlist
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
