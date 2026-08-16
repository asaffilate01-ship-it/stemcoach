CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_config(key, value)
VALUES ('cron_secret', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- Reschedule cron jobs to send the shared cron header
SELECT cron.unschedule('batch-generate-questions');
SELECT cron.unschedule('daily-mascot-notify');

SELECT cron.schedule(
  'batch-generate-questions',
  '*/2 * * * *',
  format($job$
    SELECT net.http_post(
      url := 'https://wnxnxsiojomcuxpriozt.supabase.co/functions/v1/batch-generate',
      headers := %L::jsonb,
      body := '{"action":"process"}'::jsonb
    );
  $job$, json_build_object('Content-Type','application/json','x-cron-secret',(SELECT value FROM public.app_config WHERE key='cron_secret'))::text)
);

SELECT cron.schedule(
  'daily-mascot-notify',
  '0 18 * * *',
  format($job$
    SELECT net.http_post(
      url := 'https://wnxnxsiojomcuxpriozt.supabase.co/functions/v1/daily-mascot-notify',
      headers := %L::jsonb,
      body := '{}'::jsonb
    );
  $job$, json_build_object('Content-Type','application/json','x-cron-secret',(SELECT value FROM public.app_config WHERE key='cron_secret'))::text)
);