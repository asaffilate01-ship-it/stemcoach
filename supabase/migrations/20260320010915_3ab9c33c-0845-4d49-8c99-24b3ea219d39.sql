
-- Fix: Leaderboard views - create safe aggregated views instead of exposing raw data
-- Fix: Parent link field tampering
-- Fix: Study group member visibility
-- Fix: Challenge attempts over-exposure

-- 1. Restrict daily_challenge_attempts visibility
DROP POLICY IF EXISTS "All users can view attempts for leaderboard" ON public.daily_challenge_attempts;

CREATE OR REPLACE VIEW public.challenge_leaderboard AS
SELECT user_id, score, total, time_taken_seconds, challenge_id
FROM public.daily_challenge_attempts;

ALTER VIEW public.challenge_leaderboard SET (security_invoker = off);
GRANT SELECT ON public.challenge_leaderboard TO authenticated;

-- 2. Restrict user_stats leaderboard exposure
DROP POLICY IF EXISTS "All authenticated users can view stats for leaderboard" ON public.user_stats;

CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT user_id, xp, level, streak, longest_streak
FROM public.user_stats;

ALTER VIEW public.leaderboard_stats SET (security_invoker = off);
GRANT SELECT ON public.leaderboard_stats TO authenticated;

-- 3. Fix parent_links child update tampering
DROP POLICY IF EXISTS "Children can approve links" ON public.parent_links;

CREATE POLICY "Children can approve links"
ON public.parent_links FOR UPDATE TO authenticated
USING (child_id = auth.uid())
WITH CHECK (
  child_id = auth.uid()
  AND parent_id IS NOT NULL
  AND status IN ('approved', 'rejected')
);

-- 4. Restrict study_group_members visibility to same-group members
DROP POLICY IF EXISTS "Anyone can view group members" ON public.study_group_members;

CREATE POLICY "Group members can view fellow members"
ON public.study_group_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM study_groups sg
    WHERE sg.id = study_group_members.group_id AND sg.created_by = auth.uid()
  )
);
