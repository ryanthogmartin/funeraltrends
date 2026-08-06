-- Basic per-user rate limiting for AI-backed edge functions
-- (generate-script, generate-video-topics), to cap AI spend if a client
-- misbehaves or a token is compromised.

CREATE TABLE public.function_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, function_name, window_start)
);

-- RLS is enabled with no policies for anon/authenticated roles, so this
-- table is only reachable via the service role key (which edge functions
-- use, and which bypasses RLS) or the increment function below.
ALTER TABLE public.function_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_function_rate_limits_lookup
  ON public.function_rate_limits (user_id, function_name, window_start);

-- Atomically increments (or creates) the call counter for a user/function/
-- hour-window and returns the new count, so concurrent requests can't race
-- past the limit by both reading count=0 before either writes.
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
