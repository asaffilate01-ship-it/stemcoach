
CREATE TABLE public.user_quotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_questions integer NOT NULL DEFAULT 0,
  used_questions integer NOT NULL DEFAULT 0,
  subjects text[] NOT NULL DEFAULT '{}',
  levels text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota" ON public.user_quotas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quota" ON public.user_quotas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quota" ON public.user_quotas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text,
  pack_type text NOT NULL DEFAULT 'standard',
  questions_granted integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'gbp',
  region text NOT NULL DEFAULT 'uk',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own purchases" ON public.purchases
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
