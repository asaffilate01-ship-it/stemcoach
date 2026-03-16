
-- Table to track batch generation progress
CREATE TABLE IF NOT EXISTS public.generation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  topic text NOT NULL,
  subtopic text NOT NULL,
  curriculum text NOT NULL,
  boards text[] NOT NULL DEFAULT '{}',
  difficulty int NOT NULL,
  question_type text NOT NULL,
  count int NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage generation queue"
  ON public.generation_queue FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable pg_cron and pg_net for scheduled generation
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
