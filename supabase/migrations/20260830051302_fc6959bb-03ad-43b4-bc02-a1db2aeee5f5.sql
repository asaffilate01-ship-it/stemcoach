-- Scale governed generation campaigns to a resumable 2M-question target.
ALTER TABLE public.generation_campaigns
  ADD COLUMN IF NOT EXISTS planning_cursor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS planned_questions integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS queue_jobs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS questions_per_job integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS planning_complete boolean NOT NULL DEFAULT false;

ALTER TABLE public.generation_campaigns
  DROP CONSTRAINT IF EXISTS generation_campaigns_target_questions_check;
ALTER TABLE public.generation_campaigns
  ADD CONSTRAINT generation_campaigns_target_questions_check
  CHECK (target_questions BETWEEN 1000 AND 2500000);

ALTER TABLE public.generation_campaigns
  DROP CONSTRAINT IF EXISTS generation_campaigns_questions_per_job_check;
ALTER TABLE public.generation_campaigns
  ADD CONSTRAINT generation_campaigns_questions_per_job_check
  CHECK (questions_per_job BETWEEN 5 AND 20);

ALTER TABLE public.generation_queue
  ADD COLUMN IF NOT EXISTS variant integer NOT NULL DEFAULT 0;
ALTER TABLE public.generation_queue
  DROP CONSTRAINT IF EXISTS generation_queue_variant_check;
ALTER TABLE public.generation_queue
  ADD CONSTRAINT generation_queue_variant_check CHECK (variant >= 0);

DROP INDEX IF EXISTS public.generation_queue_campaign_dimension_key;
CREATE UNIQUE INDEX IF NOT EXISTS generation_queue_campaign_dimension_variant_key
  ON public.generation_queue(
    campaign_id, subject, topic, subtopic, curriculum, boards,
    difficulty, question_type, variant
  );

-- Existing campaigns were planned by the previous single-request planner.
UPDATE public.generation_campaigns campaign
SET planning_cursor = queue_stats.jobs,
    queue_jobs = queue_stats.jobs,
    planned_questions = LEAST(campaign.target_questions, queue_stats.questions),
    questions_per_job = 20,
    planning_complete = true
FROM (
  SELECT campaign_id, count(*)::integer AS jobs, coalesce(sum(count), 0)::integer AS questions
  FROM public.generation_queue
  WHERE campaign_id IS NOT NULL
  GROUP BY campaign_id
) queue_stats
WHERE campaign.id = queue_stats.campaign_id;

-- Do not mark a campaign completed while its queue is still being planned in chunks.
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
  is_planning_complete boolean;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT planning_complete INTO is_planning_complete
  FROM public.generation_campaigns
  WHERE id = campaign;
  SELECT count(*) INTO remaining FROM public.generation_queue
  WHERE campaign_id = campaign AND status IN ('pending','processing');
  SELECT count(*) INTO failed_jobs FROM public.generation_queue
  WHERE campaign_id = campaign AND status = 'failed';

  UPDATE public.generation_campaigns
  SET generated_questions = (
        SELECT coalesce(sum(generated_count), 0)
        FROM public.generation_queue
        WHERE campaign_id = campaign
      ),
      status = CASE
        WHEN NOT coalesce(is_planning_complete, false) THEN 'planning'
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

-- Aggregate status in PostgreSQL so a 2M bank is not truncated by API row limits.
CREATE OR REPLACE FUNCTION public.get_generation_campaign_status(_campaign_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign public.generation_campaigns%ROWTYPE;
  queue_metrics jsonb;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin or service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO campaign
  FROM public.generation_campaigns
  WHERE _campaign_id IS NULL OR id = _campaign_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF campaign.id IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'queue_pending', count(*) FILTER (WHERE status = 'pending'),
    'queue_processing', count(*) FILTER (WHERE status = 'processing'),
    'queue_done', count(*) FILTER (WHERE status = 'done'),
    'queue_failed', count(*) FILTER (WHERE status = 'failed'),
    'queue_cancelled', count(*) FILTER (WHERE status = 'cancelled'),
    'queued_questions', coalesce(sum(count), 0),
    'generated', coalesce(sum(generated_count), 0)
  ) INTO queue_metrics
  FROM public.generation_queue
  WHERE campaign_id = campaign.id;

  RETURN jsonb_build_object(
    'campaign_id', campaign.id,
    'campaign_name', campaign.name,
    'campaign_status', campaign.status,
    'target', campaign.target_questions,
    'planning_cursor', campaign.planning_cursor,
    'planned_questions', campaign.planned_questions,
    'queue_jobs', campaign.queue_jobs,
    'questions_per_job', campaign.questions_per_job,
    'planning_complete', campaign.planning_complete,
    'reviewed_questions', campaign.reviewed_questions,
    'published_questions', campaign.published_questions,
    'progress_pct', CASE
      WHEN campaign.target_questions > 0
        THEN round((campaign.generated_questions::numeric / campaign.target_questions::numeric) * 100, 1)
      ELSE 0
    END
  ) || queue_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_question_bank_subject_counts()
RETURNS TABLE(subject text, question_count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin or service role required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT q.subject, count(*)::bigint
  FROM public.questions q
  GROUP BY q.subject
  ORDER BY q.subject;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_question_bank_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics jsonb;
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin or service role required' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'total_questions', count(*),
    'awaiting_review', count(*) FILTER (WHERE review_status = 'needs_review'),
    'published_total', count(*) FILTER (WHERE review_status = 'published'),
    'rejected_total', count(*) FILTER (WHERE review_status = 'rejected'),
    'archived_total', count(*) FILTER (WHERE review_status = 'archived')
  ) INTO metrics
  FROM public.questions;
  RETURN metrics;
END;
$$;

REVOKE ALL ON FUNCTION public.get_generation_campaign_status(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_question_bank_subject_counts() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_question_bank_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_generation_campaign_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_question_bank_subject_counts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_question_bank_metrics() TO authenticated, service_role;