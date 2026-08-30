CREATE OR REPLACE FUNCTION public.renew_question_review(_question_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.questions
  SET review_claimed_at = now()
  WHERE id = _question_id
    AND review_status = 'needs_review'
    AND review_claimed_by = auth.uid();
  RETURN FOUND;
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
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
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
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
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
  IF NOT public.can_review_questions(auth.uid()) THEN
    RAISE EXCEPTION 'Content reviewer role required' USING ERRCODE = '42501';
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
REVOKE ALL ON FUNCTION public.review_question_decision(uuid, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_review_queue_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_content_quality_matrix() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_question_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_question_decision(uuid, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_review_queue_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_content_quality_matrix() TO authenticated, service_role;