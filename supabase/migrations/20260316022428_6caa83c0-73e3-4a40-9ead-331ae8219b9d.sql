-- Replace overly permissive insert policy with user-scoped one
-- The notify_parent_on_exam function runs as SECURITY DEFINER so bypasses RLS
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());