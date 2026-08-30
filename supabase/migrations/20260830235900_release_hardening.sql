-- Release hardening: paid entitlement integrity, fail-closed content provenance,
-- and truthful curriculum-aware availability counts.

-- ---------------------------------------------------------------------------
-- Stripe purchase application is unique, transactional and service-role only.
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.purchases
    WHERE stripe_session_id IS NOT NULL
    GROUP BY stripe_session_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate Stripe sessions exist in purchases; reconcile them before release hardening';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS purchases_stripe_session_unique_idx
  ON public.purchases(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.grant_verified_purchase(
  _user_id uuid,
  _stripe_session_id text,
  _pack_type text,
  _questions_granted integer,
  _mock_exams_granted integer,
  _amount_paid integer,
  _currency text,
  _region text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF _user_id IS NULL OR length(trim(coalesce(_stripe_session_id, ''))) < 8 THEN
    RAISE EXCEPTION 'Invalid verified purchase identity' USING ERRCODE = '22023';
  END IF;
  IF (_pack_type, _questions_granted, _mock_exams_granted) NOT IN (
    ('standard', 5000, 20),
    ('topup', 1000, 5)
  ) THEN
    RAISE EXCEPTION 'Unsupported entitlement grant' USING ERRCODE = '22023';
  END IF;
  IF _amount_paid < 0 OR length(trim(coalesce(_currency, ''))) <> 3 THEN
    RAISE EXCEPTION 'Invalid payment totals' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.purchases (
    user_id, stripe_session_id, pack_type, questions_granted,
    amount_paid, currency, region
  ) VALUES (
    _user_id, trim(_stripe_session_id), _pack_type, _questions_granted,
    _amount_paid, lower(_currency), lower(trim(_region))
  )
  ON CONFLICT (stripe_session_id) WHERE stripe_session_id IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN RETURN false; END IF;

  INSERT INTO public.user_quotas (
    user_id, total_questions, mock_exams_total, updated_at
  ) VALUES (
    _user_id, _questions_granted, _mock_exams_granted, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_questions = public.user_quotas.total_questions + EXCLUDED.total_questions,
    mock_exams_total = coalesce(public.user_quotas.mock_exams_total, 0) + EXCLUDED.mock_exams_total,
    updated_at = now();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_verified_purchase(uuid, text, text, integer, integer, integer, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_verified_purchase(uuid, text, text, integer, integer, integer, text, text)
  TO service_role;

-- ---------------------------------------------------------------------------
-- Published content must have independent review and source provenance.
-- ---------------------------------------------------------------------------

ALTER TABLE public.questions ALTER COLUMN review_status SET DEFAULT 'needs_review';

CREATE OR REPLACE FUNCTION public.question_quality_flags(_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.questions%ROWTYPE;
  flags jsonb := '[]'::jsonb;
  option_count integer := 0;
BEGIN
  SELECT * INTO q FROM public.questions WHERE id = _question_id;
  IF q.id IS NULL THEN RETURN jsonb_build_array('question_not_found'); END IF;

  IF length(trim(q.question_text)) < 12 THEN flags := flags || '"question_too_short"'::jsonb; END IF;
  IF length(trim(q.explanation)) < 20 THEN flags := flags || '"explanation_incomplete"'::jsonb; END IF;
  IF length(trim(q.worked_solution)) < 20 THEN flags := flags || '"worked_solution_incomplete"'::jsonb; END IF;
  IF coalesce(array_length(q.tuition_tips, 1), 0) < 1 THEN flags := flags || '"tuition_tips_missing"'::jsonb; END IF;
  IF length(trim(q.exam_tip)) < 8 THEN flags := flags || '"exam_tip_missing"'::jsonb; END IF;
  IF length(trim(coalesce(q.specification_version, ''))) < 5 THEN flags := flags || '"specification_version_missing"'::jsonb; END IF;
  IF coalesce(q.source_url, '') !~ '^https://[^[:space:]]+$' THEN flags := flags || '"official_source_missing"'::jsonb; END IF;

  IF q.question_type IN ('mcq', 'code', 'data-interpretation', 'assertion-reason') THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' THEN
      flags := flags || '"options_missing"'::jsonb;
    ELSE
      option_count := jsonb_array_length(q.options);
      IF option_count < 3 OR option_count > 6 THEN flags := flags || '"invalid_option_count"'::jsonb; END IF;
      IF NOT (q.options @> jsonb_build_array(q.correct_answer)) THEN flags := flags || '"answer_not_in_options"'::jsonb; END IF;
    END IF;
  ELSIF q.question_type = 'multi-select' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 4 THEN
      flags := flags || '"options_missing"'::jsonb;
    END IF;
    IF coalesce(array_length(q.correct_answers, 1), 0) < 2 THEN flags := flags || '"multiple_answers_missing"'::jsonb; END IF;
  ELSIF q.question_type = 'numerical' THEN
    IF trim(q.correct_answer) !~ '[-+]?[0-9]' THEN flags := flags || '"numeric_answer_missing"'::jsonb; END IF;
  ELSE
    IF length(trim(coalesce(q.mark_scheme, ''))) < 20 THEN flags := flags || '"mark_scheme_missing"'::jsonb; END IF;
    IF length(trim(coalesce(q.model_answer, ''))) < 30 THEN flags := flags || '"model_answer_missing"'::jsonb; END IF;
  END IF;

  RETURN flags;
END;
$$;

-- A row marked published by a legacy/default migration is not evidence of two
-- independent academic reviews. Move it back to the review queue while keeping
-- its content intact. This may deliberately reduce learner-visible inventory.
UPDATE public.questions
SET review_status = 'needs_review',
    reviewed_by = NULL,
    reviewed_at = NULL,
    review_claimed_by = NULL,
    review_claimed_at = NULL,
    quality_flags = CASE
      WHEN jsonb_typeof(coalesce(quality_flags, '[]'::jsonb)) = 'array'
        THEN coalesce(quality_flags, '[]'::jsonb) || '"release_provenance_missing"'::jsonb
      ELSE jsonb_build_array('release_provenance_missing')
    END
WHERE review_status = 'published'
  AND (
    reviewed_by IS NULL
    OR reviewed_at IS NULL
    OR academic_verified_by IS NULL
    OR academic_verified_at IS NULL
    OR reviewed_by = academic_verified_by
    OR length(trim(coalesce(specification_version, ''))) < 5
    OR coalesce(source_url, '') !~ '^https://[^[:space:]]+$'
  );

-- ---------------------------------------------------------------------------
-- Counts shown beside a country/level/board selection must match that filter.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_curriculum_subject_question_counts(
  _curricula text[] DEFAULT NULL,
  _boards text[] DEFAULT NULL,
  _difficulty integer DEFAULT NULL
)
RETURNS TABLE(subject text, question_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.subject, count(*)::bigint
  FROM public.questions q
  WHERE q.review_status = 'published'
    AND q.reviewed_by IS NOT NULL
    AND q.academic_verified_by IS NOT NULL
    AND q.reviewed_by <> q.academic_verified_by
    AND (coalesce(cardinality(_curricula), 0) = 0 OR q.curriculum = ANY(_curricula))
    AND (coalesce(cardinality(_boards), 0) = 0 OR q.boards && _boards)
    AND (_difficulty IS NULL OR q.difficulty = _difficulty)
  GROUP BY q.subject
  ORDER BY q.subject;
$$;

REVOKE ALL ON FUNCTION public.get_curriculum_subject_question_counts(text[], text[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_curriculum_subject_question_counts(text[], text[], integer)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_content_release_readiness()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT jsonb_build_object(
      'total', count(*),
      'learner_ready', count(*) FILTER (WHERE review_status = 'published'),
      'awaiting_first_review', count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NULL),
      'awaiting_second_review', count(*) FILTER (WHERE review_status = 'needs_review' AND academic_verified_by IS NOT NULL),
      'missing_specification', count(*) FILTER (WHERE length(trim(coalesce(specification_version, ''))) < 5),
      'missing_source', count(*) FILTER (WHERE coalesce(source_url, '') !~ '^https://[^[:space:]]+$'),
      'independence_failures', count(*) FILTER (WHERE reviewed_by IS NOT NULL AND reviewed_by = academic_verified_by)
    )
    FROM public.questions
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_content_release_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_content_release_readiness() TO authenticated, service_role;
