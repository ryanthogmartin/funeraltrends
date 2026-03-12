
CREATE TABLE public.trend_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type text NOT NULL DEFAULT 'emerging',
  title text NOT NULL,
  summary text NOT NULL,
  relevance_score integer NOT NULL DEFAULT 50,
  source text NOT NULL DEFAULT 'perplexity',
  source_urls jsonb DEFAULT '[]'::jsonb,
  related_keywords jsonb DEFAULT '[]'::jsonb,
  fetched_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trend_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read trend signals" ON public.trend_signals FOR SELECT TO public USING (true);
CREATE POLICY "Service role inserts trend signals" ON public.trend_signals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role deletes trend signals" ON public.trend_signals FOR DELETE TO service_role USING (true);
