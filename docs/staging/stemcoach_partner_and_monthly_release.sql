-- STAGING DESIGN ONLY. This file is NOT an executable migration in supabase/migrations.
-- Review/validate against a cloned STEMCoach database and generate a proper migration
-- with Supabase CLI before applying. Do NOT run on production from this chat.
-- Dependencies: 20261017160000_partner_course_scopes.sql and question review schema.

BEGIN;

-- Preserve old source IDs and add only the two new partners.
ALTER TABLE public.education_partner_bindings
  DROP CONSTRAINT IF EXISTS education_partner_bindings_source_product_check;
ALTER TABLE public.education_partner_bindings
  ADD CONSTRAINT education_partner_bindings_source_product_check
  CHECK (source_product IN ('ilmvero', 'unipathways', 'traindirekt', 'skillfinch'));

-- A monthly collection is only a RELEASE of already academically-published questions.
-- Individual questions may be withdrawn independently; clients must always check
-- review_status at query time and must not download hidden answer keys.
CREATE TABLE IF NOT EXISTS public.stemcoach_monthly_releases (
  release_month text PRIMARY KEY CHECK (release_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','under_review','approved','published','withdrawn')),
  published_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'published' OR (
    reviewed_by IS NOT NULL AND approved_at IS NOT NULL
    AND published_at IS NOT NULL AND published_at >= approved_at
  ))
);

CREATE TABLE IF NOT EXISTS public.stemcoach_monthly_release_items (
  release_month text NOT NULL REFERENCES public.stemcoach_monthly_releases(release_month) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (release_month, question_id),
  UNIQUE (question_id)
);
CREATE INDEX IF NOT EXISTS stemcoach_release_items_question_idx
  ON public.stemcoach_monthly_release_items (question_id);

-- Service-role-only billing source of truth; never editable by the learner.
-- A verified billing webhook must create/extend entries idempotently.
CREATE TABLE IF NOT EXISTS public.stemcoach_monthly_subscriber_entitlements (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_subscription_ref text NOT NULL
    CHECK (length(billing_subscription_ref) BETWEEN 8 AND 250),
  plan_code text NOT NULL CHECK (plan_code IN ('student_monthly','institution_monthly')),
  access_from timestamptz NOT NULL,
  access_until timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('active','grace','cancelled','revoked')),
  verified_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, billing_subscription_ref),
  CHECK (access_until > access_from),
  CHECK (verified_at <= access_until)
);

DO $rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'stemcoach_monthly_releases',
    'stemcoach_monthly_release_items',
    'stemcoach_monthly_subscriber_entitlements'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', t);
  END LOOP;
END;
$rls$;

-- This routine can only be invoked by the service role after getUser/JWT validation.
-- A learner cannot pass arbitrary user IDs through the public Data API.
CREATE OR REPLACE FUNCTION public.stemcoach_partner_question_eligible(
  _user_id uuid, _subject text, _curriculum text
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
  SELECT _user_id IS NOT NULL AND _subject IS NOT NULL AND _curriculum IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.education_partner_course_proposals proposal
      JOIN public.education_partner_bindings binding
        ON binding.id = proposal.binding_id
      JOIN public.education_partner_course_maps course
        ON course.id = proposal.course_map_id
        AND course.binding_id = binding.id
      JOIN public.education_partner_learner_links learner
        ON learner.id = proposal.learner_link_id
        AND learner.binding_id = binding.id
      JOIN public.tenant_members membership
        ON membership.tenant_id = binding.tenant_id
       AND membership.user_id = learner.stemcoach_user_id
       AND membership.role = 'student'
       AND membership.status = 'approved'
      WHERE learner.stemcoach_user_id = _user_id
        AND binding.source_product IN ('unipathways','traindirekt','skillfinch')
        AND binding.status = 'verified'
        AND course.status = 'reviewed'
        AND course.subject = _subject
        AND course.curriculum = _curriculum
        AND learner.status = 'verified'
        AND learner.revoked_at IS NULL
        AND learner.verified_until > now()
        AND proposal.status = 'reviewed'
        AND proposal.effective_from <= now()
        AND proposal.effective_until > now()
        AND (binding.valid_until IS NULL OR binding.valid_until > now())
    )
    -- Simple fair-use limit in UTC. Add a serializable transactional receipt
    -- before making a high-volume deployment or promising unlimited attempts.
    AND (
      SELECT count(*) FROM public.attempts attempts
      WHERE attempts.user_id = _user_id
        AND attempts.created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
    ) < 100;
$fn$;
REVOKE ALL ON FUNCTION public.stemcoach_partner_question_eligible(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stemcoach_partner_question_eligible(uuid, text, text)
  TO service_role;

-- Atomic sponsored answer transaction: a transaction-scoped per-user/day lock
-- serialises the 100-attempt UTC fair-use check with the attempt insert. A
-- failure rolls back both. Service role must separately authenticate the user
-- through getUser before invoking this function with its UUID.
CREATE OR REPLACE FUNCTION public.record_stemcoach_partner_answer(
  _user_id uuid, _question_id uuid, _submitted_answer text,
  _correct boolean, _time_taken_seconds integer
) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
  selected_subject text;
  selected_curriculum text;
BEGIN
  IF _user_id IS NULL OR _question_id IS NULL
     OR _submitted_answer IS NULL
     OR length(btrim(_submitted_answer)) NOT BETWEEN 1 AND 2000
     OR _correct IS NULL
     OR (_time_taken_seconds IS NOT NULL
         AND _time_taken_seconds NOT BETWEEN 0 AND 86400) THEN
    RAISE EXCEPTION 'Invalid sponsored answer arguments'
      USING ERRCODE = '22023';
  END IF;

  -- Same learner and same UTC date must use the same transaction lock.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      _user_id::text || ':' ||
      pg_catalog.to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD'), 0)
  );

  SELECT question.subject, question.curriculum
    INTO selected_subject, selected_curriculum
  FROM public.questions question
  WHERE question.id = _question_id AND question.review_status = 'published';

  IF NOT FOUND OR NOT public.stemcoach_partner_question_eligible(
     _user_id, selected_subject, selected_curriculum
  ) THEN
    RAISE EXCEPTION 'Sponsored question access denied or daily cap reached'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.attempts (
    user_id, question_id, answer, correct, time_taken_seconds
  ) VALUES (
    _user_id, _question_id, _submitted_answer, _correct, _time_taken_seconds
  );
  RETURN true;
END;
$fn$;
REVOKE ALL ON FUNCTION public.record_stemcoach_partner_answer(
  uuid, uuid, text, boolean, integer
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_stemcoach_partner_answer(
  uuid, uuid, text, boolean, integer
) TO service_role;

-- A subscriber eligibility result is not a content release or a refund-proof.
CREATE OR REPLACE FUNCTION public.stemcoach_monthly_subscriber_eligible(
  _user_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $fn$
  SELECT _user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.stemcoach_monthly_subscriber_entitlements entitlement
    WHERE entitlement.user_id = _user_id
      AND entitlement.status IN ('active','grace')
      AND entitlement.access_from <= now()
      AND entitlement.access_until > now()
  );
$fn$;
REVOKE ALL ON FUNCTION public.stemcoach_monthly_subscriber_eligible(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.stemcoach_monthly_subscriber_eligible(uuid)
  TO service_role;

-- Atomic release operation must reject nonpublished items and empty months.
CREATE OR REPLACE FUNCTION public.publish_stemcoach_monthly_release(
  _month text, _reviewer uuid
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
  approved_count integer;
  all_count integer;
BEGIN
  IF _month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' OR _reviewer IS NULL THEN
    RAISE EXCEPTION 'Invalid release approval' USING ERRCODE = '22023';
  END IF;
  PERFORM 1 FROM public.stemcoach_monthly_releases
    WHERE release_month = _month AND status = 'approved' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Release is not approved' USING ERRCODE = '42501';
  END IF;
  SELECT count(*)::integer, count(*) FILTER (WHERE q.review_status = 'published')::integer
    INTO all_count, approved_count
  FROM public.stemcoach_monthly_release_items ri
  JOIN public.questions q ON q.id = ri.question_id
  WHERE ri.release_month = _month;
  IF all_count < 1 OR all_count <> approved_count THEN
    RAISE EXCEPTION 'Every released question must be academically published'
      USING ERRCODE = '23514';
  END IF;
  UPDATE public.stemcoach_monthly_releases
    SET status = 'published', reviewed_by = _reviewer,
        approved_at = coalesce(approved_at, now()),
        published_at = now(), updated_at = now()
    WHERE release_month = _month;
  RETURN approved_count;
END;
$fn$;
REVOKE ALL ON FUNCTION public.publish_stemcoach_monthly_release(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_stemcoach_monthly_release(text, uuid)
  TO service_role;

COMMIT;

-- REQUIRED STAGING TESTS BEFORE ACTUAL MIGRATION:
-- no enrolled learner, unapproved tenant/student, wrong curriculum,
-- wrong subject, expired binding/learner/proposal, revoked learner,
-- unauthenticated API and spoofed user ID MUST ALL DENY.
-- A service role must be the only caller of the sensitive functions.
-- Verify concurrent usage serialises via advisory lock and never passes 100/day.\n-- Test transactions rollback on invalid answers / INSERT failures.
-- Monthly Stripe webhooks, frontend quota mirror and content fetch gates
-- MUST be integrated and deployed together before any launch.
