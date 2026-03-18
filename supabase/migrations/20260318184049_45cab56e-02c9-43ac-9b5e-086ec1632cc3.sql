-- Remove client-side INSERT on user_quotas — only service role (verify-purchase) can create rows
DROP POLICY IF EXISTS "Users can insert own quota" ON public.user_quotas;

-- Allow users to update ONLY subjects and levels on their own row (not total_questions)
DROP POLICY IF EXISTS "Users can update own quota" ON public.user_quotas;

CREATE POLICY "Users can update own quota subjects and levels"
ON public.user_quotas
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());