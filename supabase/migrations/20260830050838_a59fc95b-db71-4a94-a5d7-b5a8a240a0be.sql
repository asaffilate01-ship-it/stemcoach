-- Persist a learner's chosen STEM Squad coach across devices.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_mascot text NOT NULL DEFAULT 'stemcoach';

ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_preferred_mascot_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_preferred_mascot_check
  CHECK (preferred_mascot IN (
    'stemcoach', 'mathematics', 'physics', 'chemistry', 'biology', 'computer-science',
    'economics', 'english-literature', 'psychology', 'geography', 'business-studies',
    'ielts', 'celta', 'french', 'german'
  ));

-- Add interaction formats that have deterministic server-side grading.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN (
    'mcq', 'multi-select', 'numerical', 'multi-step', 'essay', 'code',
    'data-interpretation', 'assertion-reason', 'true-false', 'ordering', 'short-answer'
  ));

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.generation_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_questions integer NOT NULL CHECK (target_questions BETWEEN 1000 AND 250000),
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','queued','running','paused','completed','failed')),
  generated_questions integer NOT NULL DEFAULT 0,
  reviewed_questions integer NOT NULL DEFAULT 0,
  published_questions integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_campaigns TO authenticated;
GRANT ALL ON public.generation_campaigns TO service_role;

ALTER TABLE public.generation_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage generation campaigns" ON public.generation_campaigns;
CREATE POLICY "Admins manage generation campaigns" ON public.generation_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep each STEM Team coaching thread available when the learner returns or changes device.
CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coach_conversations_user_subject_key UNIQUE (user_id, subject),
  CONSTRAINT coach_conversations_messages_check CHECK (jsonb_typeof(messages) = 'array' AND jsonb_array_length(messages) <= 60)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_conversations TO authenticated;
GRANT ALL ON public.coach_conversations TO service_role;

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own coach conversations" ON public.coach_conversations;
CREATE POLICY "Users manage own coach conversations" ON public.coach_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS coach_conversations_user_updated_idx ON public.coach_conversations(user_id, updated_at DESC);

ALTER TABLE public.generation_queue
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.generation_campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS generated_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.generation_queue DROP CONSTRAINT IF EXISTS generation_queue_status_check;
ALTER TABLE public.generation_queue ADD CONSTRAINT generation_queue_status_check
  CHECK (status IN ('pending','processing','done','failed','cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS generation_queue_campaign_dimension_key
  ON public.generation_queue(campaign_id, subject, topic, subtopic, curriculum, boards, difficulty, question_type)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS generation_queue_claim_idx
  ON public.generation_queue(status, attempts, created_at);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS generation_campaign_id uuid REFERENCES public.generation_campaigns(id) ON DELETE SET NULL;

UPDATE public.questions
SET content_hash = encode(extensions.digest(
  lower(trim(regexp_replace(subject || '|' || curriculum || '|' || question_text, '\s+', ' ', 'g'))),
  'sha256'
), 'hex')
WHERE content_hash IS NULL;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY subject, curriculum, content_hash ORDER BY created_at, id) AS duplicate_rank
  FROM public.questions
)
UPDATE public.questions q
SET content_hash = q.content_hash || ':' || q.id::text,
    review_status = 'archived',
    quality_flags = coalesce(q.quality_flags, '[]'::jsonb) || '"duplicate_content"'::jsonb
FROM ranked r
WHERE q.id = r.id AND r.duplicate_rank > 1;

ALTER TABLE public.questions ALTER COLUMN content_hash SET NOT NULL;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_content_identity_key;
ALTER TABLE public.questions ADD CONSTRAINT questions_content_identity_key UNIQUE (subject, curriculum, content_hash);

CREATE OR REPLACE FUNCTION public.set_question_content_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.content_hash := encode(extensions.digest(
    lower(trim(regexp_replace(NEW.subject || '|' || NEW.curriculum || '|' || NEW.question_text, '\s+', ' ', 'g'))),
    'sha256'
  ), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_question_content_hash_trigger ON public.questions;
CREATE TRIGGER set_question_content_hash_trigger
BEFORE INSERT OR UPDATE OF subject, curriculum, question_text ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.set_question_content_hash();

CREATE OR REPLACE FUNCTION public.refresh_generation_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign uuid;
  remaining integer;
  failed_jobs integer;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  SELECT count(*) INTO remaining FROM public.generation_queue
  WHERE campaign_id = campaign AND status IN ('pending','processing');
  SELECT count(*) INTO failed_jobs FROM public.generation_queue
  WHERE campaign_id = campaign AND status = 'failed';
  UPDATE public.generation_campaigns
  SET generated_questions = (SELECT coalesce(sum(generated_count), 0) FROM public.generation_queue WHERE campaign_id = campaign),
      status = CASE
        WHEN remaining = 0 AND failed_jobs > 0 THEN 'failed'
        WHEN remaining = 0 THEN 'completed'
        ELSE 'running'
      END,
      updated_at = now()
  WHERE id = campaign;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_generation_campaign_trigger ON public.generation_queue;
CREATE TRIGGER refresh_generation_campaign_trigger
AFTER UPDATE OF status, generated_count OR DELETE ON public.generation_queue
FOR EACH ROW EXECUTE FUNCTION public.refresh_generation_campaign();

CREATE OR REPLACE FUNCTION public.refresh_generation_review_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign uuid;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.generation_campaign_id ELSE NEW.generation_campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  UPDATE public.generation_campaigns
  SET reviewed_questions = (SELECT count(*) FROM public.questions WHERE generation_campaign_id = campaign AND reviewed_at IS NOT NULL),
      published_questions = (SELECT count(*) FROM public.questions WHERE generation_campaign_id = campaign AND review_status = 'published'),
      updated_at = now()
  WHERE id = campaign;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_generation_review_counts_trigger ON public.questions;
CREATE TRIGGER refresh_generation_review_counts_trigger
AFTER UPDATE OF review_status, reviewed_at OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.refresh_generation_review_counts();

CREATE OR REPLACE FUNCTION public.claim_generation_queue(_limit integer DEFAULT 3)
RETURNS SETOF public.generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM public.generation_queue
    WHERE status = 'pending' AND attempts < 3
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(coalesce(_limit, 3), 1), 10)
  )
  UPDATE public.generation_queue q
  SET status = 'processing', claimed_at = now(), attempts = attempts + 1, last_error = NULL
  FROM claimed
  WHERE q.id = claimed.id
  RETURNING q.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_generation_queue(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_generation_queue(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.question_quality_flags(_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
  IF coalesce(array_length(q.boards, 1), 0) < 1 THEN flags := flags || '"board_mapping_missing"'::jsonb; END IF;
  IF length(trim(coalesce(q.specification_version, ''))) < 5 THEN flags := flags || '"specification_version_missing"'::jsonb; END IF;
  IF q.content_origin LIKE 'ai-%' AND coalesce(q.source_url, '') !~ '^https://' THEN flags := flags || '"official_source_url_missing"'::jsonb; END IF;

  IF q.question_type IN ('mcq', 'code', 'data-interpretation', 'assertion-reason') THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' THEN
      flags := flags || '"options_missing"'::jsonb;
    ELSE
      option_count := jsonb_array_length(q.options);
      IF option_count < 3 OR option_count > 6 THEN flags := flags || '"invalid_option_count"'::jsonb; END IF;
      IF NOT (q.options @> jsonb_build_array(q.correct_answer)) THEN flags := flags || '"answer_not_in_options"'::jsonb; END IF;
    END IF;
  ELSIF q.question_type = 'true-false' THEN
    IF q.options IS NULL OR q.options <> '["True", "False"]'::jsonb THEN flags := flags || '"true_false_options_invalid"'::jsonb; END IF;
    IF q.correct_answer NOT IN ('True', 'False') THEN flags := flags || '"true_false_answer_invalid"'::jsonb; END IF;
  ELSIF q.question_type = 'ordering' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 3 THEN flags := flags || '"ordering_items_missing"'::jsonb; END IF;
    IF position(' → ' in q.correct_answer) = 0 THEN flags := flags || '"ordering_answer_invalid"'::jsonb; END IF;
    IF q.options IS NOT NULL AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(q.options) AS ordered_option(value)
      WHERE position(ordered_option.value in q.correct_answer) = 0
    ) THEN flags := flags || '"ordering_answer_incomplete"'::jsonb; END IF;
  ELSIF q.question_type = 'multi-select' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 4 THEN flags := flags || '"options_missing"'::jsonb; END IF;
    IF coalesce(array_length(q.correct_answers, 1), 0) < 2 THEN flags := flags || '"multiple_answers_missing"'::jsonb; END IF;
    IF q.options IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(coalesce(q.correct_answers, ARRAY[]::text[])) AS accepted_answer(value)
      WHERE NOT (q.options @> jsonb_build_array(accepted_answer.value))
    ) THEN flags := flags || '"multi_select_answer_not_in_options"'::jsonb; END IF;
  ELSIF q.question_type = 'numerical' THEN
    IF trim(q.correct_answer) !~ '[-+]?[0-9]' THEN flags := flags || '"numeric_answer_missing"'::jsonb; END IF;
  ELSIF q.question_type = 'short-answer' THEN
    IF length(trim(q.correct_answer)) < 2 THEN flags := flags || '"short_answer_missing"'::jsonb; END IF;
  ELSE
    IF length(trim(coalesce(q.mark_scheme, ''))) < 20 THEN flags := flags || '"mark_scheme_missing"'::jsonb; END IF;
    IF length(trim(coalesce(q.model_answer, ''))) < 30 THEN flags := flags || '"model_answer_missing"'::jsonb; END IF;
  END IF;

  RETURN flags;
END;
$$;