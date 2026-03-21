
-- Add category column to funeral_trends
ALTER TABLE public.funeral_trends ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- Create user_keywords table for dynamic keyword tracking
CREATE TABLE public.user_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  category text DEFAULT 'custom',
  is_public boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, keyword)
);

ALTER TABLE public.user_keywords ENABLE ROW LEVEL SECURITY;

-- Users can read their own keywords
CREATE POLICY "Users can read own keywords" ON public.user_keywords
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can read public keywords from others
CREATE POLICY "Anyone can read public keywords" ON public.user_keywords
  FOR SELECT TO authenticated USING (is_public = true);

-- Users can insert own keywords
CREATE POLICY "Users can insert own keywords" ON public.user_keywords
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can delete own keywords
CREATE POLICY "Users can delete own keywords" ON public.user_keywords
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Users can update own keywords
CREATE POLICY "Users can update own keywords" ON public.user_keywords
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
