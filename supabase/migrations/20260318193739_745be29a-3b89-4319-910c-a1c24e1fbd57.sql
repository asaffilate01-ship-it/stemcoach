-- 1. Remove client INSERT on purchases (service-role only via edge functions)
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;

-- 2. Restrict user_quotas UPDATE to only subjects and levels columns
DROP POLICY IF EXISTS "Users can update own quota subjects and levels" ON public.user_quotas;
DROP POLICY IF EXISTS "Users can update own quota subjects and levels only" ON public.user_quotas;
CREATE POLICY "Users can update own quota subjects and levels only"
ON public.user_quotas
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND total_questions = (SELECT uq.total_questions FROM public.user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
  AND used_questions = (SELECT uq.used_questions FROM public.user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
);

-- 3. Add unique constraint on active_sessions.user_id for single-session enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions (user_id);