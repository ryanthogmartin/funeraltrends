-- Anti-repetition layer (Task 5): store a compact fingerprint of every
-- generated script per user, so new generations can be checked against the
-- account's recent history and near-duplicates regenerated instead of
-- silently returned.

CREATE TABLE public.script_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  -- SHA-256 hex of the normalized hook+body, for cheap exact-dup checks
  content_hash TEXT NOT NULL,
  -- Normalized (lowercased, punctuation-stripped, whitespace-collapsed)
  -- hook+body text, capped in the function, used for similarity scoring
  normalized_text TEXT NOT NULL,
  idea_text TEXT,
  tone TEXT,
  biz_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS enabled with no anon/authenticated policies: only edge functions
-- (service role, bypasses RLS) read/write this table.
ALTER TABLE public.script_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_script_fingerprints_user_recent
  ON public.script_fingerprints (user_id, created_at DESC);

CREATE INDEX idx_script_fingerprints_user_hash
  ON public.script_fingerprints (user_id, content_hash);
