DO $$
BEGIN
  PERFORM cron.unschedule('daily-funeral-data-refresh')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-funeral-data-refresh');
END $$;