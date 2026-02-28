
CREATE TABLE public.saved_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('idea', 'script')),
  idea_text TEXT NOT NULL,
  script_hook TEXT,
  script_body TEXT,
  script_cta TEXT,
  script_tone TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved ideas" ON public.saved_ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved ideas" ON public.saved_ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved ideas" ON public.saved_ideas
  FOR DELETE USING (auth.uid() = user_id);
