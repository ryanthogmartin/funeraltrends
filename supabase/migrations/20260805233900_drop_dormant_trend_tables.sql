-- Drop dormant trend-tracking infrastructure.
-- These tables supported the old Google Trends / Reddit / hashtag intelligence
-- dashboard, which has no remaining edge functions or frontend pages populating
-- or reading them. Safe to remove -- the Video Content Engine (voice_profiles,
-- saved_ideas) does not depend on any of these.

DROP TABLE IF EXISTS public.funeral_trends CASCADE;
DROP TABLE IF EXISTS public.funeral_reddit_posts CASCADE;
DROP TABLE IF EXISTS public.trend_signals CASCADE;
DROP TABLE IF EXISTS public.keyword_watchlist CASCADE;
DROP TABLE IF EXISTS public.user_keywords CASCADE;
