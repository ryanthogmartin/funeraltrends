-- Scheduled cleanup for operational tables that otherwise grow forever.
--
-- function_rate_limits: hourly per-user call counters — only the current
-- hour's window is ever read, so anything older than a day is dead weight.
-- We keep 7 days for debugging/abuse investigation.
--
-- script_fingerprints: anti-repetition history — generate-script only
-- compares against each user's 30 most recent rows, so rows older than
-- 30 days can never influence a similarity check. Deleting them also
-- purges old test/junk generations.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent: unschedule first if a job with the same name already exists,
-- so re-running this migration (or a from-scratch replay) never errors.
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-rate-limits')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits');
  PERFORM cron.unschedule('cleanup-script-fingerprints')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-script-fingerprints');
END $$;

-- Daily at 09:13 UTC (~2am Arizona): drop rate-limit windows older than 7 days.
SELECT cron.schedule(
  'cleanup-rate-limits',
  '13 9 * * *',
  $$DELETE FROM public.function_rate_limits WHERE window_start < now() - interval '7 days'$$
);

-- Daily at 09:17 UTC: drop fingerprints older than 30 days.
SELECT cron.schedule(
  'cleanup-script-fingerprints',
  '17 9 * * *',
  $$DELETE FROM public.script_fingerprints WHERE created_at < now() - interval '30 days'$$
);
