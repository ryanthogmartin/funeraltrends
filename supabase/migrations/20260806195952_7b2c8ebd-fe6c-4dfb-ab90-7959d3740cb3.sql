DROP TABLE IF EXISTS public.funeral_trends CASCADE;
DROP TABLE IF EXISTS public.funeral_reddit_posts CASCADE;
DROP TABLE IF EXISTS public.trend_signals CASCADE;
DROP TABLE IF EXISTS public.keyword_watchlist CASCADE;
DROP TABLE IF EXISTS public.user_keywords CASCADE;

CREATE TABLE public.function_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, function_name, window_start)
);

GRANT ALL ON public.function_rate_limits TO service_role;

ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_function_rate_limits_lookup
  ON public.function_rate_limits (user_id, function_name, window_start);

CREATE OR REPLACE FUNCTION public.increment_function_rate_limit(
  p_user_id UUID,
  p_function_name TEXT,
  p_window_start TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO public.function_rate_limits (user_id, function_name, window_start, call_count)
  VALUES (p_user_id, p_function_name, p_window_start, 1)
  ON CONFLICT (user_id, function_name, window_start)
  DO UPDATE SET call_count = public.function_rate_limits.call_count + 1
  RETURNING call_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_function_rate_limit(UUID, TEXT, TIMESTAMP WITH TIME ZONE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_function_rate_limit(UUID, TEXT, TIMESTAMP WITH TIME ZONE) TO service_role;

CREATE TABLE public.script_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_hash TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  idea_text TEXT,
  tone TEXT,
  biz_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.script_fingerprints TO service_role;

ALTER TABLE public.script_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_script_fingerprints_user_recent
  ON public.script_fingerprints (user_id, created_at DESC);

CREATE INDEX idx_script_fingerprints_user_hash
  ON public.script_fingerprints (user_id, content_hash);