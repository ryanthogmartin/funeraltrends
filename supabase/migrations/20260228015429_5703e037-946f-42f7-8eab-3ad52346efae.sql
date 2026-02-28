
-- Drop overly permissive policies
DROP POLICY "Service role can manage trends" ON public.funeral_trends;
DROP POLICY "Service role can manage reddit posts" ON public.funeral_reddit_posts;

-- Replace with role-specific policies (service_role only)
CREATE POLICY "Service role inserts trends" ON public.funeral_trends FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role deletes trends" ON public.funeral_trends FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role inserts reddit posts" ON public.funeral_reddit_posts FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role deletes reddit posts" ON public.funeral_reddit_posts FOR DELETE TO service_role USING (true);
