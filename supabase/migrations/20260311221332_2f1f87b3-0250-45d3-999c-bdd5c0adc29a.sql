ALTER TABLE public.voice_profiles
  ADD COLUMN origin_story text DEFAULT '',
  ADD COLUMN content_pillars text DEFAULT '',
  ADD COLUMN target_audience_age text NOT NULL DEFAULT 'all-ages',
  ADD COLUMN signature_opening text DEFAULT '',
  ADD COLUMN video_style text NOT NULL DEFAULT 'talking-head',
  ADD COLUMN faith_lens text NOT NULL DEFAULT 'prefer-not',
  ADD COLUMN taboo_topics text DEFAULT '',
  ADD COLUMN anecdote_style text NOT NULL DEFAULT 'occasionally';