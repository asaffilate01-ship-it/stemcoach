-- Independent two-pass academic verification for the governed question bank.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS academic_verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS academic_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_revision integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS questions_second_review_queue_idx
  ON public.questions(academic_verified_at, created_at)
  WHERE review_status = 'needs_review' AND academic_verified_by IS NOT NULL;

-- Browser/API inserts can never self-declare as reviewed. Trusted migrations
-- and service-role workers remain able to load explicitly governed seed data.
CREATE OR REPLACE FUNCTION public.enforce_question_insert_review_state()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.review_status := 'needs_review';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.review_claimed_by := NULL;
    NEW.review_claimed_at := NULL;
    NEW.academic_verified_by := NULL;
    NEW.academic_verified_at := NULL;
    NEW.quality_flags := '[]'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_question_insert_review_state_trigger ON public.questions;
CREATE TRIGGER enforce_question_insert_review_state_trigger
BEFORE INSERT ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.enforce_question_insert_review_state();

-- Governance fields may only be changed by SECURITY DEFINER review functions,
-- never by a direct browser update that happens to hold an admin session.
CREATE OR REPLACE FUNCTION public.guard_direct_question_review_state_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    RAISE EXCEPTION 'Use the audited question review workflow' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_direct_question_review_state_trigger ON public.questions;
CREATE TRIGGER guard_direct_question_review_state_trigger
BEFORE UPDATE OF
  review_status, reviewed_by, reviewed_at, review_claimed_by, review_claimed_at,
  academic_verified_by, academic_verified_at, review_notes, review_revision,
  quality_flags, content_hash
ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.guard_direct_question_review_state_update();

-- Preserve the audit chain. Browser administrators archive through the audited
-- RPC; hard deletion remains a service-role/migration operation only.
REVOKE DELETE ON public.questions FROM authenticated;

ALTER TABLE public.question_review_events
  DROP CONSTRAINT IF EXISTS question_review_events_action_check;
ALTER TABLE public.question_review_events
  ADD CONSTRAINT question_review_events_action_check
  CHECK (action IN ('claimed','released','verified','published','rejected','returned','archived','verification_reset'));

-- Any material edit invalidates prior approval at the database boundary. This
-- protects learner-visible content even when an edit is made outside the UI.
CREATE OR REPLACE FUNCTION public.invalidate_question_verification_on_edit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  had_verification boolean;
BEGIN
  had_verification := OLD.review_status = 'published' OR OLD.academic_verified_by IS NOT NULL;

  NEW.review_status := 'needs_review';
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  NEW.review_claimed_by := NULL;
  NEW.review_claimed_at := NULL;
  NEW.academic_verified_by := NULL;
  NEW.academic_verified_at := NULL;
  NEW.quality_flags := '[]'::jsonb;
  NEW.review_revision := OLD.review_revision + 1;

  IF had_verification THEN
    INSERT INTO public.question_review_events (
      question_id, reviewer_id, action, notes, question_snapshot
    ) VALUES (
      OLD.id,
      auth.uid(),
      'verification_reset',
      'Material content changed; independent verification must be repeated',
      jsonb_build_object(
        'review_revision', OLD.review_revision,
        'review_status', OLD.review_status,
        'academic_verified_by', OLD.academic_verified_by,
        'reviewed_by', OLD.reviewed_by,
        'content_hash', OLD.content_hash
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS invalidate_question_verification_trigger ON public.questions;
CREATE TRIGGER invalidate_question_verification_trigger
BEFORE UPDATE OF
  subject, topic, subtopic, curriculum, boards, difficulty, question_type,
  question_text, options, correct_answer, correct_answers, allow_multiple_answers,
  explanation, worked_solution, tuition_tips, exam_tip, formula, points,
  mark_scheme, model_answer, max_marks, command_word, specification_version, source_url
ON public.questions
FOR EACH ROW
WHEN (
  OLD.subject IS DISTINCT FROM NEW.subject
  OR OLD.topic IS DISTINCT FROM NEW.topic
  OR OLD.subtopic IS DISTINCT FROM NEW.subtopic
  OR OLD.curriculum IS DISTINCT FROM NEW.curriculum
  OR OLD.boards IS DISTINCT FROM NEW.boards
  OR OLD.difficulty IS DISTINCT FROM NEW.difficulty
  OR OLD.question_type IS DISTINCT FROM NEW.question_type
  OR OLD.question_text IS DISTINCT FROM NEW.question_text
  OR OLD.options IS DISTINCT FROM NEW.options
  OR OLD.correct_answer IS DISTINCT FROM NEW.correct_answer
  OR OLD.correct_answers IS DISTINCT FROM NEW.correct_answers
  OR OLD.allow_multiple_answers IS DISTINCT FROM NEW.allow_multiple_answers
  OR OLD.explanation IS DISTINCT FROM NEW.explanation
  OR OLD.worked_solution IS DISTINCT FROM NEW.worked_solution
  OR OLD.tuition_tips IS DISTINCT FROM NEW.tuition_tips
  OR OLD.exam_tip IS DISTINCT FROM NEW.exam_tip
  OR OLD.formula IS DISTINCT FROM NEW.formula
  OR OLD.points IS DISTINCT FROM NEW.points
  OR OLD.mark_scheme IS DISTINCT FROM NEW.mark_scheme
  OR OLD.model_answer IS DISTINCT FROM NEW.model_answer
  OR OLD.max_marks IS DISTINCT FROM NEW.max_marks
  OR OLD.command_word IS DISTINCT FROM NEW.command_word
  OR OLD.specification_version IS DISTINCT FROM NEW.specification_version
  OR OLD.source_url IS DISTINCT FROM NEW.source_url
)
EXECUTE FUNCTION public.invalidate_question_verification_on_edit();

-- Material edits can change review state inside the BEFORE trigger even when
-- review_status was not in the original SET list. A WHEN predicate catches the
-- actual state change without recounting campaigns for claim heartbeats.
DROP TRIGGER IF EXISTS refresh_generation_review_counts_trigger ON public.questions;
DROP TRIGGER IF EXISTS refresh_generation_review_counts_update_trigger ON public.questions;
DROP TRIGGER IF EXISTS refresh_generation_review_counts_delete_trigger ON public.questions;
CREATE TRIGGER refresh_generation_review_counts_update_trigger
AFTER UPDATE ON public.questions
FOR EACH ROW
WHEN (
  OLD.review_status IS DISTINCT FROM NEW.review_status
  OR OLD.reviewed_at IS DISTINCT FROM NEW.reviewed_at
  OR OLD.generation_campaign_id IS DISTINCT FROM NEW.generation_campaign_id
)
EXECUTE FUNCTION public.refresh_generation_review_counts();
CREATE TRIGGER refresh_generation_review_counts_delete_trigger
AFTER DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.refresh_generation_review_counts();

-- Keep an actively used review claim alive without generating noisy audit rows.
CREATE OR REPLACE FUNCTION public.renew_question_review(_question_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.questions
  SET review_claimed_at = now()
  WHERE id = _question_id
    AND review_status = 'needs_review'
    AND review_claimed_by = auth.uid();
  RETURN FOUND;
END;
$$;

-- A reviewer who completed pass one cannot claim the same question for pass two.
CREATE OR REPLACE FUNCTION public.claim_question_review(_question_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed public.questions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
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
      'boards', claimed.boards,
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
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT q.id
    FROM public.questions q
    WHERE q.review_status = 'needs_review'
      AND q.academic_verified_by IS DISTINCT FROM auth.uid()
      AND (_subject IS NULL OR q.subject = _subject)
      AND (_curriculum IS NULL OR q.curriculum = _curriculum)
      AND (
        q.review_claimed_by IS NULL
        OR q.review_claimed_by = auth.uid()
        OR q.review_claimed_at < now() - interval '60 minutes'
      )
    ORDER BY
      CASE WHEN q.academic_verified_by IS NOT NULL THEN 0 ELSE 1 END,
      q.created_at,
      q.id
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 100)
  ), updated AS (
    UPDATE public.questions q
    SET review_claimed_by = auth.uid(), review_claimed_at = now()
    FROM candidates c
    WHERE q.id = c.id
    RETURNING q.*
  ), logged AS (
    INSERT INTO public.question_review_events (question_id, reviewer_id, action, question_snapshot)
    SELECT
      u.id,
      auth.uid(),
      'claimed',
      jsonb_build_object(
        'review_revision', u.review_revision,
        'review_pass', CASE WHEN u.academic_verified_by IS NULL THEN 1 ELSE 2 END,
        'subject', u.subject,
        'curriculum', u.curriculum,
        'boards', u.boards,
        'question_type', u.question_type,
        'specification_version', u.specification_version,
        'source_url', u.source_url
      )
    FROM updated u
    RETURNING id
  )
  SELECT u.* FROM updated u;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_question_decision(
  _question_id uuid,
  _decision text,
  _notes text DEFAULT NULL,
  _attested boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.questions%ROWTYPE;
  flags jsonb := '[]'::jsonb;
  clean_notes text := left(nullif(trim(_notes), ''), 4000);
  event_action text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  IF _decision NOT IN ('published', 'rejected', 'needs_review', 'archived') THEN
    RAISE EXCEPTION 'Unsupported review decision' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO q FROM public.questions WHERE id = _question_id FOR UPDATE;
  IF q.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'question_not_found');
  END IF;
  IF q.review_claimed_by IS DISTINCT FROM auth.uid()
     OR q.review_claimed_at IS NULL
     OR q.review_claimed_at < now() - interval '60 minutes' THEN
    RETURN jsonb_build_object('success', false, 'error', 'active_review_claim_required');
  END IF;

  IF _decision = 'published' THEN
    IF NOT _attested THEN
      RETURN jsonb_build_object('success', false, 'error', 'academic_attestation_required');
    END IF;
    flags := public.question_quality_flags(_question_id);
    UPDATE public.questions SET quality_flags = flags WHERE id = _question_id;
    IF jsonb_array_length(flags) > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'quality_flags', 'flags', flags);
    END IF;

    IF q.academic_verified_by IS NULL THEN
      UPDATE public.questions
      SET academic_verified_by = auth.uid(),
          academic_verified_at = now(),
          review_notes = clean_notes,
          review_claimed_by = NULL,
          review_claimed_at = NULL
      WHERE id = q.id;

      INSERT INTO public.question_review_events (
        question_id, reviewer_id, action, notes, flags_snapshot, question_snapshot
      ) VALUES (
        q.id,
        auth.uid(),
        'verified',
        clean_notes,
        flags,
        jsonb_build_object(
          'review_revision', q.review_revision,
          'review_pass', 1,
          'subject', q.subject,
          'curriculum', q.curriculum,
          'boards', q.boards,
          'question_type', q.question_type,
          'specification_version', q.specification_version,
          'source_url', q.source_url,
          'content_hash', q.content_hash
        )
      );
      RETURN jsonb_build_object(
        'success', true,
        'decision', 'verified',
        'requires_second_review', true,
        'flags', flags
      );
    END IF;

    IF q.academic_verified_by = auth.uid() THEN
      RETURN jsonb_build_object('success', false, 'error', 'independent_second_reviewer_required');
    END IF;
    event_action := 'published';
  ELSIF _decision = 'rejected' THEN
    IF clean_notes IS NULL OR length(clean_notes) < 10 THEN
      RETURN jsonb_build_object('success', false, 'error', 'rejection_reason_required');
    END IF;
    event_action := 'rejected';
  ELSIF _decision = 'archived' THEN
    event_action := 'archived';
  ELSE
    event_action := 'returned';
  END IF;

  UPDATE public.questions
  SET review_status = _decision,
      review_notes = clean_notes,
      reviewed_by = CASE WHEN _decision IN ('published','rejected','archived') THEN auth.uid() ELSE NULL END,
      reviewed_at = CASE WHEN _decision IN ('published','rejected','archived') THEN now() ELSE NULL END,
      review_claimed_by = NULL,
      review_claimed_at = NULL,
      academic_verified_by = CASE WHEN _decision = 'needs_review' THEN NULL ELSE academic_verified_by END,
      academic_verified_at = CASE WHEN _decision = 'needs_review' THEN NULL ELSE academic_verified_at END
  WHERE id = _question_id;

  INSERT INTO public.question_review_events (
    question_id, reviewer_id, action, notes, flags_snapshot, question_snapshot
  ) VALUES (
    q.id,
    auth.uid(),
    event_action,
    clean_notes,
    flags,
    jsonb_build_object(
      'review_revision', q.review_revision,
      'review_pass', CASE WHEN q.academic_verified_by IS NULL THEN 1 ELSE 2 END,
      'first_reviewer_id', q.academic_verified_by,
      'subject', q.subject,
      'curriculum', q.curriculum,
      'boards', q.boards,
      'question_type', q.question_type,
      'specification_version', q.specification_version,
      'source_url', q.source_url,
      'content_hash', q.content_hash
    )
  );

  RETURN jsonb_build_object('success', true, 'decision', _decision, 'flags', flags);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_review_queue_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'needs_review', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review'),
    'awaiting_first_review', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND academic_verified_by IS NULL),
    'awaiting_second_review', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND academic_verified_by IS NOT NULL),
    'unclaimed', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND (review_claimed_by IS NULL OR review_claimed_at < now() - interval '60 minutes')),
    'claimed_by_me', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND review_claimed_by = auth.uid() AND review_claimed_at >= now() - interval '60 minutes'),
    'published', (SELECT count(*) FROM public.questions WHERE review_status = 'published'),
    'rejected', (SELECT count(*) FROM public.questions WHERE review_status = 'rejected'),
    'reviewed_today', (SELECT count(*) FROM public.question_review_events WHERE reviewer_id = auth.uid() AND action IN ('verified','published','rejected','archived') AND created_at >= current_date)
  );
END;
$$;

-- Curriculum/subject roll-up keeps the quality and coverage gaps visible
-- without returning or loading individual question records.
CREATE OR REPLACE FUNCTION public.get_content_quality_matrix()
RETURNS TABLE (
  curriculum text,
  subject text,
  total_questions bigint,
  awaiting_first_review bigint,
  awaiting_second_review bigint,
  published_questions bigint,
  rejected_questions bigint,
  flagged_questions bigint,
  missing_source bigint,
  missing_specification bigint,
  publication_pct numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    q.curriculum,
    q.subject,
    count(*)::bigint,
    count(*) FILTER (WHERE q.review_status = 'needs_review' AND q.academic_verified_by IS NULL)::bigint,
    count(*) FILTER (WHERE q.review_status = 'needs_review' AND q.academic_verified_by IS NOT NULL)::bigint,
    count(*) FILTER (WHERE q.review_status = 'published')::bigint,
    count(*) FILTER (WHERE q.review_status = 'rejected')::bigint,
    count(*) FILTER (WHERE CASE
      WHEN jsonb_typeof(coalesce(q.quality_flags, '[]'::jsonb)) = 'array'
        THEN jsonb_array_length(coalesce(q.quality_flags, '[]'::jsonb)) > 0
      ELSE true
    END)::bigint,
    count(*) FILTER (WHERE coalesce(q.source_url, '') !~ '^https://')::bigint,
    count(*) FILTER (WHERE length(trim(coalesce(q.specification_version, ''))) < 5)::bigint,
    CASE WHEN count(*) > 0 THEN round(
      count(*) FILTER (WHERE q.review_status = 'published')::numeric / count(*)::numeric * 100,
      1
    ) ELSE 0 END
  FROM public.questions q
  GROUP BY q.curriculum, q.subject
  ORDER BY
    count(*) FILTER (WHERE q.review_status = 'needs_review') DESC,
    q.curriculum,
    q.subject;
END;
$$;

REVOKE ALL ON FUNCTION public.renew_question_review(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_question_review(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_question_review_batch(integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_question_decision(uuid, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_review_queue_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_content_quality_matrix() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_question_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_question_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_question_review_batch(integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_question_decision(uuid, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_review_queue_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_content_quality_matrix() TO authenticated, service_role;
