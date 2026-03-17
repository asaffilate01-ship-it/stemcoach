
-- CRITICAL: Remove the self-service INSERT policy on user_roles that allows privilege escalation
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- Replace with a restricted policy: only allow inserting 'student' role for yourself
CREATE POLICY "Users can insert student role only"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND role = 'student'::app_role
);

-- Fix certificates: Replace the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;

-- Create a restricted function for certificate verification by code
CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE(title text, subject text, score_percent integer, achievement_type text, issued_at timestamptz, verification_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT title, subject, score_percent, achievement_type, issued_at, verification_code
  FROM public.certificates
  WHERE verification_code = _code
  LIMIT 1
$$;

-- Fix classroom messages: restrict reads to class members only
DROP POLICY IF EXISTS "Anyone can read classroom messages" ON public.classroom_messages;

CREATE POLICY "Class members can read classroom messages"
ON public.classroom_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id::text = classroom_messages.room_id
    AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id::text = classroom_messages.room_id
    AND c.teacher_id = auth.uid()
  )
);

-- Fix user_stats: keep public SELECT for leaderboard but add comment
-- The "Users can view own stats" policy with USING(true) is intentional for the leaderboard feature
-- But rename it for clarity
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;

CREATE POLICY "All authenticated users can view stats for leaderboard"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);
