CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-rate-limits')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits');
  PERFORM cron.unschedule('cleanup-script-fingerprints')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-script-fingerprints');
END $$;

SELECT cron.schedule(
  'cleanup-rate-limits',
  '13 9 * * *',
  $$DELETE FROM public.function_rate_limits WHERE window_start < now() - interval '7 days'$$
);

SELECT cron.schedule(
  'cleanup-script-fingerprints',
  '17 9 * * *',
  $$DELETE FROM public.script_fingerprints WHERE created_at < now() - interval '30 days'$$
);