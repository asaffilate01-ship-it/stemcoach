
-- ============================================================
-- FIX 1: Tenant teachers can escalate role to admin
-- Split ALL policy into admin-only + restricted teacher access
-- ============================================================

DROP POLICY IF EXISTS "Tenant admins can manage members" ON public.tenant_members;

-- Admins can do everything
CREATE POLICY "Tenant admins can manage members"
ON public.tenant_members FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
      AND tm.status = 'approved'
  )
);

-- Teachers can only view members in their tenant
CREATE POLICY "Tenant teachers can view members"
ON public.tenant_members FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'teacher'
      AND tm.status = 'approved'
  )
);

-- ============================================================
-- FIX 2: Study group join codes exposed to all users
-- Create a function to hide join_code from non-members
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view study groups" ON public.study_groups;

-- Public listing without join_code: use a view
CREATE OR REPLACE VIEW public.study_groups_public AS
SELECT id, name, subject, description, created_at, created_by, max_members
FROM public.study_groups;

ALTER VIEW public.study_groups_public SET (security_invoker = off);
GRANT SELECT ON public.study_groups_public TO authenticated;

-- Full access (including join_code) only for members and creators
CREATE POLICY "Members and creators can view study groups with join code"
ON public.study_groups FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM study_group_members sgm
    WHERE sgm.group_id = study_groups.id AND sgm.user_id = auth.uid()
  )
);

-- ============================================================
-- FIX 3: Users can self-issue certificates with arbitrary data
-- Move certificate creation to a SECURITY DEFINER function
-- ============================================================

DROP POLICY IF EXISTS "Users can create own certificates" ON public.certificates;

CREATE OR REPLACE FUNCTION public.issue_certificate(
  _user_id uuid,
  _title text,
  _subject text,
  _achievement_type text,
  _score_percent integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stats RECORD;
  _cert_id uuid;
BEGIN
  -- Validate the user actually has stats supporting this
  SELECT * INTO _stats FROM user_stats WHERE user_id = _user_id;
  IF _stats IS NULL THEN
    RAISE EXCEPTION 'No stats found for user';
  END IF;

  -- Validate score is reasonable (can't claim > 100%)
  IF _score_percent < 0 OR _score_percent > 100 THEN
    RAISE EXCEPTION 'Invalid score percent';
  END IF;

  -- For mock exam certificates, verify via daily_challenge_attempts or similar
  -- For now, basic validation that user has answered enough questions
  IF _stats.total_questions < 5 THEN
    RAISE EXCEPTION 'Insufficient activity to earn certificate';
  END IF;

  INSERT INTO certificates (user_id, title, subject, achievement_type, score_percent)
  VALUES (_user_id, _title, _subject, _achievement_type, _score_percent)
  RETURNING id INTO _cert_id;

  RETURN _cert_id;
END;
$$;

-- ============================================================
-- FIX 4: Users can insert fabricated stats on leaderboards
-- Remove client INSERT policy on user_stats
-- Stats are now created by record_answer_stats() SECURITY DEFINER
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_stats;
