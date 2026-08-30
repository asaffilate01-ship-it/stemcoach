-- Reviewer expertise, workload controls and launch-readiness reporting.
CREATE TABLE IF NOT EXISTS public.reviewer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subjects text[] NOT NULL DEFAULT '{}',
  curricula text[] NOT NULL DEFAULT '{}',
  question_types text[] NOT NULL DEFAULT '{}',
  daily_review_limit integer NOT NULL DEFAULT 100 CHECK (daily_review_limit BETWEEN 1 AND 500),
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviewer_profiles_active_idx
  ON public.reviewer_profiles(active) WHERE active;

ALTER TABLE public.reviewer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviewers view own profile" ON public.reviewer_profiles;
CREATE POLICY "Reviewers view own profile" ON public.reviewer_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage reviewer profiles" ON public.reviewer_profiles;
CREATE POLICY "Admins manage reviewer profiles" ON public.reviewer_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.reviewer_profiles TO authenticated;
GRANT ALL ON public.reviewer_profiles TO service_role;

CREATE OR REPLACE FUNCTION public.can_review_questions(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role) OR (
    public.has_role(_user_id, 'reviewer'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.reviewer_profiles reviewer
      WHERE reviewer.user_id = _user_id AND reviewer.active
    )
  )
$$;

-- Reviewers can read only work in their expertise or questions they personally
-- reviewed. They do not receive general administrator access to the bank.
DROP POLICY IF EXISTS "Reviewers read assigned question content" ON public.questions;
CREATE POLICY "Reviewers read assigned question content" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'reviewer')
    AND EXISTS (
      SELECT 1 FROM public.reviewer_profiles reviewer
      WHERE reviewer.user_id = auth.uid()
        AND reviewer.active
        AND (cardinality(reviewer.subjects) = 0 OR questions.subject = ANY(reviewer.subjects))
        AND (cardinality(reviewer.curricula) = 0 OR questions.curriculum = ANY(reviewer.curricula))
        AND (cardinality(reviewer.question_types) = 0 OR questions.question_type = ANY(reviewer.question_types))
    )
    AND (
      questions.review_status = 'needs_review'
      OR questions.reviewed_by = auth.uid()
      OR questions.academic_verified_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Content team view question review events" ON public.question_review_events;
CREATE POLICY "Content team view question review events" ON public.question_review_events
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_review_events.question_id
        AND (q.review_claimed_by = auth.uid() OR q.academic_verified_by = auth.uid() OR q.reviewed_by = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.reviewer_can_claim_question(_question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR EXISTS (
    SELECT 1
    FROM public.questions q
    JOIN public.reviewer_profiles reviewer ON reviewer.user_id = auth.uid()
    WHERE q.id = _question_id
      AND reviewer.active
      AND public.has_role(auth.uid(), 'reviewer')
      AND (cardinality(reviewer.subjects) = 0 OR q.subject = ANY(reviewer.subjects))
      AND (cardinality(reviewer.curricula) = 0 OR q.curriculum = ANY(reviewer.curricula))
      AND (cardinality(reviewer.question_types) = 0 OR q.question_type = ANY(reviewer.question_types))
      AND (
        SELECT count(*)
        FROM public.question_review_events event
        WHERE event.reviewer_id = auth.uid()
          AND event.action IN ('verified','published','rejected','archived')
          AND event.created_at >= current_date
      ) + (
        SELECT count(*)
        FROM public.questions active_claim
        WHERE active_claim.review_claimed_by = auth.uid()
          AND active_claim.review_claimed_at >= now() - interval '60 minutes'
      ) < reviewer.daily_review_limit
  )
$$;

REVOKE ALL ON FUNCTION public.reviewer_can_claim_question(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reviewer_can_claim_question(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.claim_question_review(_question_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed public.questions%ROWTYPE;
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.reviewer_can_claim_question(_question_id) THEN
    RAISE EXCEPTION 'Question is outside reviewer expertise or daily limit' USING ERRCODE = '42501';
  END IF;

  UPDATE public.questions
  SET review_claimed_by = auth.uid(), review_claimed_at = now()
  WHERE id = _question_id
    AND review_status = 'needs_review'
    AND academic_verified_by IS DISTINCT FROM auth.uid()
    AND (
      review_claimed_by IS NULL
      OR review_claimed_by = auth.uid()
      OR review_claimed_at < now() - interval '60 minutes'
    )
  RETURNING * INTO claimed;

  IF claimed.id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.question_review_events (question_id, reviewer_id, action, question_snapshot)
  VALUES (
    claimed.id,
    auth.uid(),
    'claimed',
    jsonb_build_object(
      'review_revision', claimed.review_revision,
      'review_pass', CASE WHEN claimed.academic_verified_by IS NULL THEN 1 ELSE 2 END,
      'subject', claimed.subject,
      'curriculum', claimed.curriculum,
      'question_type', claimed.question_type,
      'specification_version', claimed.specification_version,
      'source_url', claimed.source_url
    )
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_question_review_batch(
  _limit integer DEFAULT 20,
  _subject text DEFAULT NULL,
  _curriculum text DEFAULT NULL
)
RETURNS SETOF public.questions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_limit integer;
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  IF public.has_role(auth.uid(), 'admin') THEN
    allowed_limit := LEAST(GREATEST(coalesce(_limit, 20), 1), 100);
  ELSE
    SELECT greatest(
      reviewer.daily_review_limit - (
        SELECT count(*) FROM public.question_review_events event
        WHERE event.reviewer_id = auth.uid()
          AND event.action IN ('verified','published','rejected','archived')
          AND event.created_at >= current_date
      ) - (
        SELECT count(*) FROM public.questions active_claim
        WHERE active_claim.review_claimed_by = auth.uid()
          AND active_claim.review_claimed_at >= now() - interval '60 minutes'
      ),
      0
    )::integer
    INTO allowed_limit
    FROM public.reviewer_profiles reviewer
    WHERE reviewer.user_id = auth.uid() AND reviewer.active;
    allowed_limit := LEAST(GREATEST(coalesce(allowed_limit, 0), 0), LEAST(GREATEST(coalesce(_limit, 20), 1), 100));
  END IF;

  IF allowed_limit = 0 THEN RETURN; END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT q.id
    FROM public.questions q
    WHERE q.review_status = 'needs_review'
      AND q.academic_verified_by IS DISTINCT FROM auth.uid()
      AND (_subject IS NULL OR q.subject = _subject)
      AND (_curriculum IS NULL OR q.curriculum = _curriculum)
      AND (
        public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.reviewer_profiles reviewer
          WHERE reviewer.user_id = auth.uid()
            AND reviewer.active
            AND (cardinality(reviewer.subjects) = 0 OR q.subject = ANY(reviewer.subjects))
            AND (cardinality(reviewer.curricula) = 0 OR q.curriculum = ANY(reviewer.curricula))
            AND (cardinality(reviewer.question_types) = 0 OR q.question_type = ANY(reviewer.question_types))
        )
      )
      AND (
        q.review_claimed_by IS NULL
        OR q.review_claimed_by = auth.uid()
        OR q.review_claimed_at < now() - interval '60 minutes'
      )
    ORDER BY CASE WHEN q.academic_verified_by IS NOT NULL THEN 0 ELSE 1 END, q.created_at, q.id
    FOR UPDATE SKIP LOCKED
    LIMIT allowed_limit
  ), updated AS (
    UPDATE public.questions q
    SET review_claimed_by = auth.uid(), review_claimed_at = now()
    FROM candidates candidate
    WHERE q.id = candidate.id
    RETURNING q.*
  ), logged AS (
    INSERT INTO public.question_review_events (question_id, reviewer_id, action, question_snapshot)
    SELECT
      updated.id,
      auth.uid(),
      'claimed',
      jsonb_build_object(
        'review_revision', updated.review_revision,
        'review_pass', CASE WHEN updated.academic_verified_by IS NULL THEN 1 ELSE 2 END,
        'subject', updated.subject,
        'curriculum', updated.curriculum,
        'question_type', updated.question_type,
        'specification_version', updated.specification_version,
        'source_url', updated.source_url
      )
    FROM updated
    RETURNING id
  )
  SELECT updated.* FROM updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_question_review(_question_id uuid, _notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released public.questions%ROWTYPE;
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.questions
  SET review_claimed_by = NULL, review_claimed_at = NULL
  WHERE id = _question_id AND review_status = 'needs_review' AND review_claimed_by = auth.uid()
  RETURNING * INTO released;
  IF released.id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.question_review_events (question_id, reviewer_id, action, notes)
  VALUES (released.id, auth.uid(), 'released', left(nullif(trim(_notes), ''), 4000));
  RETURN true;
END;
$$;

-- Admin-only onboarding by email prevents reviewers gaining broader privileges.
CREATE OR REPLACE FUNCTION public.configure_content_reviewer(
  _email text,
  _active boolean DEFAULT true,
  _subjects text[] DEFAULT '{}',
  _curricula text[] DEFAULT '{}',
  _question_types text[] DEFAULT '{}',
  _daily_review_limit integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user uuid;
  clean_subjects text[];
  clean_curricula text[];
  clean_types text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(_email), '') IS NULL THEN
    RAISE EXCEPTION 'Reviewer email is required' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO target_user FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF target_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_not_found');
  END IF;

  clean_subjects := ARRAY(SELECT DISTINCT trim(item.value) FROM unnest(coalesce(_subjects, '{}')) AS item(value) WHERE trim(item.value) <> '');
  clean_curricula := ARRAY(SELECT DISTINCT trim(item.value) FROM unnest(coalesce(_curricula, '{}')) AS item(value) WHERE trim(item.value) <> '');
  clean_types := ARRAY(SELECT DISTINCT trim(item.value) FROM unnest(coalesce(_question_types, '{}')) AS item(value) WHERE trim(item.value) <> '');

  INSERT INTO public.reviewer_profiles (
    user_id, subjects, curricula, question_types, daily_review_limit, active, created_by, updated_at
  ) VALUES (
    target_user,
    clean_subjects,
    clean_curricula,
    clean_types,
    LEAST(GREATEST(coalesce(_daily_review_limit, 100), 1), 500),
    coalesce(_active, true),
    auth.uid(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    subjects = excluded.subjects,
    curricula = excluded.curricula,
    question_types = excluded.question_types,
    daily_review_limit = excluded.daily_review_limit,
    active = excluded.active,
    updated_at = now();

  IF coalesce(_active, true) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user, 'reviewer')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = target_user AND role = 'reviewer';
  END IF;

  RETURN jsonb_build_object('success', true, 'user_id', target_user, 'active', coalesce(_active, true));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reviewer_workload()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  subjects text[],
  curricula text[],
  daily_review_limit integer,
  active boolean,
  active_claims bigint,
  verified_today bigint,
  published_today bigint,
  rejected_today bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    reviewer.user_id,
    coalesce(profile.display_name, 'Reviewer'),
    reviewer.subjects,
    reviewer.curricula,
    reviewer.daily_review_limit,
    reviewer.active,
    (SELECT count(*) FROM public.questions q WHERE q.review_claimed_by = reviewer.user_id AND q.review_claimed_at >= now() - interval '60 minutes'),
    (SELECT count(*) FROM public.question_review_events event WHERE event.reviewer_id = reviewer.user_id AND event.action = 'verified' AND event.created_at >= current_date),
    (SELECT count(*) FROM public.question_review_events event WHERE event.reviewer_id = reviewer.user_id AND event.action = 'published' AND event.created_at >= current_date),
    (SELECT count(*) FROM public.question_review_events event WHERE event.reviewer_id = reviewer.user_id AND event.action = 'rejected' AND event.created_at >= current_date)
  FROM public.reviewer_profiles reviewer
  LEFT JOIN public.profiles profile ON profile.user_id = reviewer.user_id
  WHERE public.has_role(auth.uid(), 'admin') OR reviewer.user_id = auth.uid()
  ORDER BY reviewer.active DESC, coalesce(profile.display_name, 'Reviewer');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_content_release_readiness()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics jsonb;
  velocity numeric;
  outstanding bigint;
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_questions', count(*),
    'awaiting_first_review', count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NULL),
    'awaiting_second_review', count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NOT NULL),
    'published', count(*) FILTER (WHERE review_status = 'published'),
    'rejected', count(*) FILTER (WHERE review_status = 'rejected'),
    'flagged', count(*) FILTER (WHERE CASE
      WHEN jsonb_typeof(coalesce(quality_flags, '[]'::jsonb)) = 'array'
        THEN jsonb_array_length(coalesce(quality_flags, '[]'::jsonb)) > 0
      ELSE true
    END),
    'published_missing_source', count(*) FILTER (WHERE review_status = 'published' AND coalesce(source_url, '') !~ '^https://'),
    'published_missing_specification', count(*) FILTER (WHERE review_status = 'published' AND length(trim(coalesce(specification_version, ''))) < 5)
  ),
  (count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NULL) * 2
    + count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NOT NULL))::bigint
  INTO metrics, outstanding
  FROM public.questions;

  SELECT count(*)::numeric / 7
  INTO velocity
  FROM public.question_review_events
  WHERE action IN ('verified','published') AND created_at >= now() - interval '7 days';

  RETURN metrics || jsonb_build_object(
    'active_reviewers', (SELECT count(*) FROM public.reviewer_profiles WHERE active),
    'review_passes_remaining', outstanding,
    'daily_review_velocity_7d', round(coalesce(velocity, 0), 1),
    'estimated_days_to_clear', CASE WHEN coalesce(velocity, 0) > 0 THEN ceil(outstanding / velocity) ELSE NULL END,
    'release_ready', outstanding = 0
      AND coalesce((metrics ->> 'flagged')::bigint, 0) = 0
      AND coalesce((metrics ->> 'published_missing_source')::bigint, 0) = 0
      AND coalesce((metrics ->> 'published_missing_specification')::bigint, 0) = 0
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_question_review(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_question_review_batch(integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_question_review(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.configure_content_reviewer(text, boolean, text[], text[], text[], integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_reviewer_workload() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_content_release_readiness() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_review_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_question_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_question_review_batch(integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_question_review(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.configure_content_reviewer(text, boolean, text[], text[], text[], integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reviewer_workload() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_content_release_readiness() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_review_questions(uuid) TO authenticated, service_role;
