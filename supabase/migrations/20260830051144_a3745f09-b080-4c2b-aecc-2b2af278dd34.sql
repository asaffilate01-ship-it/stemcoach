-- Scalable, auditable academic review for the governed 2M+ content bank.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS review_claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_notes text;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_review_notes_length_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_review_notes_length_check
  CHECK (review_notes IS NULL OR length(review_notes) <= 4000);

CREATE INDEX IF NOT EXISTS questions_review_queue_claim_idx
  ON public.questions(review_status, review_claimed_at, created_at)
  WHERE review_status = 'needs_review';
CREATE INDEX IF NOT EXISTS questions_reviewer_claim_idx
  ON public.questions(review_claimed_by, review_claimed_at DESC)
  WHERE review_claimed_by IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.question_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('claimed','released','published','rejected','returned','archived')),
  notes text,
  flags_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT question_review_events_notes_length_check CHECK (notes IS NULL OR length(notes) <= 4000)
);

CREATE INDEX IF NOT EXISTS question_review_events_question_created_idx
  ON public.question_review_events(question_id, created_at DESC);
CREATE INDEX IF NOT EXISTS question_review_events_reviewer_created_idx
  ON public.question_review_events(reviewer_id, created_at DESC);

REVOKE ALL ON public.question_review_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.question_review_events TO authenticated;
GRANT ALL ON public.question_review_events TO service_role;

ALTER TABLE public.question_review_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view question review events" ON public.question_review_events;
CREATE POLICY "Admins view question review events" ON public.question_review_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

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
    AND (
      review_claimed_by IS NULL
      OR review_claimed_by = auth.uid()
      OR review_claimed_at < now() - interval '60 minutes'
    )
  RETURNING * INTO claimed;

  IF claimed.id IS NULL THEN RETURN false; END IF;

  INSERT INTO public.question_review_events (
    question_id, reviewer_id, action, question_snapshot
  ) VALUES (
    claimed.id,
    auth.uid(),
    'claimed',
    jsonb_build_object(
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
      AND (_subject IS NULL OR q.subject = _subject)
      AND (_curriculum IS NULL OR q.curriculum = _curriculum)
      AND (
        q.review_claimed_by IS NULL
        OR q.review_claimed_by = auth.uid()
        OR q.review_claimed_at < now() - interval '60 minutes'
      )
    ORDER BY q.created_at, q.id
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 100)
  ), updated AS (
    UPDATE public.questions q
    SET review_claimed_by = auth.uid(), review_claimed_at = now()
    FROM candidates c
    WHERE q.id = c.id
    RETURNING q.*
  ), logged AS (
    INSERT INTO public.question_review_events (
      question_id, reviewer_id, action, question_snapshot
    )
    SELECT
      u.id,
      auth.uid(),
      'claimed',
      jsonb_build_object(
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

CREATE OR REPLACE FUNCTION public.release_question_review(_question_id uuid, _notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  released public.questions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
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

  SELECT * INTO q
  FROM public.questions
  WHERE id = _question_id
  FOR UPDATE;
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
      review_claimed_at = NULL
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
    'unclaimed', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND (review_claimed_by IS NULL OR review_claimed_at < now() - interval '60 minutes')),
    'claimed_by_me', (SELECT count(*) FROM public.questions WHERE review_status = 'needs_review' AND review_claimed_by = auth.uid() AND review_claimed_at >= now() - interval '60 minutes'),
    'published', (SELECT count(*) FROM public.questions WHERE review_status = 'published'),
    'rejected', (SELECT count(*) FROM public.questions WHERE review_status = 'rejected'),
    'reviewed_today', (SELECT count(*) FROM public.question_review_events WHERE reviewer_id = auth.uid() AND action IN ('published','rejected','archived') AND created_at >= current_date)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_question(_question_id uuid, _notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived public.questions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.questions
  SET review_status = 'archived',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      review_notes = left(nullif(trim(_notes), ''), 4000),
      review_claimed_by = NULL,
      review_claimed_at = NULL
  WHERE id = _question_id
  RETURNING * INTO archived;
  IF archived.id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.question_review_events (question_id, reviewer_id, action, notes, flags_snapshot, question_snapshot)
  VALUES (
    archived.id,
    auth.uid(),
    'archived',
    left(nullif(trim(_notes), ''), 4000),
    coalesce(archived.quality_flags, '[]'::jsonb),
    jsonb_build_object('subject', archived.subject, 'curriculum', archived.curriculum, 'boards', archived.boards, 'content_hash', archived.content_hash)
  );
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_question_review(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_question_review_batch(integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.release_question_review(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_question_decision(uuid, text, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_review_queue_metrics() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.archive_question(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_question_review(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_question_review_batch(integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_question_review(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_question_decision(uuid, text, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_review_queue_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_question(uuid, text) TO authenticated, service_role;

-- The audited decision RPC replaces the legacy direct publishing route for browser users.
REVOKE EXECUTE ON FUNCTION public.publish_question(uuid) FROM authenticated;