-- Phase 1: share only human-reviewed, non-personal educational answers.
-- Never publish arbitrary student prompts, chat histories or AI output into
-- the institution-wide answer library. Service-role-only access is intentional.

CREATE TABLE IF NOT EXISTS public.coach_approved_answer_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  curriculum text NOT NULL,
  language text NOT NULL CHECK (language IN ('en', 'fr', 'de')),
  prompt_hash text NOT NULL CHECK (prompt_hash ~ '^[0-9a-f]{64}$'),
  answer_text text NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 20000),
  source_reference text,
  specification_version text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'retired')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_audit_reference text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coach_answer_must_be_reviewed CHECK (
    status <> 'approved' OR (reviewed_at IS NOT NULL
      AND NULLIF(btrim(reviewer_audit_reference), '') IS NOT NULL
      AND NULLIF(btrim(source_reference), '') IS NOT NULL)
  ),
  CONSTRAINT coach_approved_answer_identity UNIQUE (subject, curriculum, language, prompt_hash)
);

ALTER TABLE public.coach_approved_answer_library ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_approved_answer_library FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_approved_answer_library TO service_role;

CREATE INDEX IF NOT EXISTS coach_approved_answer_lookup
ON public.coach_approved_answer_library(subject, curriculum, language, prompt_hash)
WHERE status = 'approved';

-- Personal response reuse is strictly per learner with a short expiry.
-- Store only a context hash, never raw user messages in the cache key.
CREATE TABLE IF NOT EXISTS public.coach_private_answer_cache (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_hash text NOT NULL CHECK (cache_hash ~ '^[0-9a-f]{64}$'),
  subject text NOT NULL,
  response_text text NOT NULL CHECK (char_length(response_text) BETWEEN 1 AND 20000),
  model text NOT NULL,
  hit_count integer NOT NULL DEFAULT 0 CHECK (hit_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  PRIMARY KEY (user_id, cache_hash)
);

ALTER TABLE public.coach_private_answer_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_private_answer_cache FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_private_answer_cache TO service_role;

CREATE INDEX IF NOT EXISTS coach_private_cache_subject
ON public.coach_private_answer_cache(user_id, subject);
CREATE INDEX IF NOT EXISTS coach_private_cache_expiry
ON public.coach_private_answer_cache(expires_at);

-- This function must be invoked daily by a privileged scheduled job.
-- Expired rows are never served, even if the cleanup has not run.
CREATE OR REPLACE FUNCTION public.purge_expired_coach_answers()
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin') THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.coach_private_answer_cache WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_expired_coach_answers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_coach_answers() TO service_role;

-- Legacy essay-grading cache used a cross-user key containing a reversible
-- encoding of part of the learner answer. Purge those entries when migrating.
DO $$
BEGIN
  IF to_regclass('public.coaching_cache') IS NOT NULL THEN
    DELETE FROM public.coaching_cache WHERE action = 'grade-essay';
  END IF;
END;
$$;

-- Provisional AI feedback consumes allowance without becoming verified learning evidence.
CREATE TABLE public.provisional_feedback_receipts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint text NOT NULL CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fingerprint)
);
ALTER TABLE public.provisional_feedback_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.provisional_feedback_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.provisional_feedback_receipts TO service_role;
CREATE OR REPLACE FUNCTION public.consume_provisional_feedback(_user_id uuid, _question_id uuid, _fingerprint text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  subject_id text;
  allowance public.user_quotas%ROWTYPE;
  used_count bigint;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(_user_id::text, 91));
  SELECT subject INTO subject_id FROM public.questions WHERE id = _question_id AND review_status = 'published';
  IF subject_id IS NULL THEN RAISE EXCEPTION 'Published question required'; END IF;
  SELECT * INTO allowance FROM public.user_quotas WHERE user_id = _user_id FOR UPDATE;
  IF allowance.total_questions > 0 AND cardinality(allowance.subjects) > 0 AND NOT(subject_id = ANY(allowance.subjects)) THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.provisional_feedback_receipts WHERE user_id = _user_id AND fingerprint = _fingerprint) THEN RETURN true; END IF;
  IF allowance.total_questions > 0 THEN
    IF coalesce(allowance.used_questions,0) >= allowance.total_questions THEN RETURN false; END IF;
    UPDATE public.user_quotas SET used_questions = coalesce(used_questions,0)+1 WHERE user_id = _user_id;
  ELSE
    SELECT count(*) INTO used_count FROM public.attempts a JOIN public.questions q ON q.id=a.question_id WHERE a.user_id=_user_id AND q.subject=subject_id;
    used_count := used_count + (SELECT count(*) FROM public.provisional_feedback_receipts WHERE user_id=_user_id AND subject=subject_id);
    IF used_count >= 5 THEN RETURN false; END IF;
  END IF;
  INSERT INTO public.provisional_feedback_receipts(user_id,fingerprint,subject) VALUES (_user_id,_fingerprint,subject_id);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_provisional_feedback(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_provisional_feedback(uuid,uuid,text) TO service_role;
