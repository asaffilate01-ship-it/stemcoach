-- Production controls for long-running, governed question-bank campaigns.
ALTER TABLE public.generation_campaigns
  DROP CONSTRAINT IF EXISTS generation_campaigns_status_check;
ALTER TABLE public.generation_campaigns
  ADD CONSTRAINT generation_campaigns_status_check
  CHECK (status IN ('planning','queued','running','paused','completed','failed','cancelled'));

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
  current_status text;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT planning_complete, status INTO is_planning_complete, current_status
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
        WHEN current_status IN ('paused','cancelled') THEN current_status
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
    SELECT queue.id
    FROM public.generation_queue queue
    LEFT JOIN public.generation_campaigns campaign ON campaign.id = queue.campaign_id
    WHERE queue.status = 'pending'
      AND queue.attempts < 3
      AND (queue.campaign_id IS NULL OR campaign.status IN ('planning','queued','running'))
    ORDER BY queue.created_at
    FOR UPDATE OF queue SKIP LOCKED
    LIMIT LEAST(GREATEST(coalesce(_limit, 3), 1), 10)
  )
  UPDATE public.generation_queue queue
  SET status = 'processing', claimed_at = now(), attempts = queue.attempts + 1, last_error = NULL
  FROM claimed
  WHERE queue.id = claimed.id
  RETURNING queue.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_generation_queue(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_generation_queue(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.manage_generation_campaign(_campaign_id uuid, _action text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign public.generation_campaigns%ROWTYPE;
  affected_jobs integer := 0;
  next_status text;
BEGIN
  IF current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO campaign
  FROM public.generation_campaigns
  WHERE id = _campaign_id;
  IF campaign.id IS NULL THEN
    RAISE EXCEPTION 'Generation campaign not found' USING ERRCODE = 'P0002';
  END IF;

  CASE lower(_action)
    WHEN 'pause' THEN
      IF campaign.status NOT IN ('planning','queued','running') THEN
        RAISE EXCEPTION 'A % campaign cannot be paused', campaign.status USING ERRCODE = '22023';
      END IF;
      UPDATE public.generation_campaigns SET status = 'paused', updated_at = now()
      WHERE id = campaign.id;
      next_status := 'paused';

    WHEN 'resume' THEN
      IF campaign.status <> 'paused' THEN
        RAISE EXCEPTION 'Only a paused campaign can be resumed' USING ERRCODE = '22023';
      END IF;
      next_status := CASE
        WHEN NOT campaign.planning_complete THEN 'planning'
        WHEN EXISTS (
          SELECT 1 FROM public.generation_queue
          WHERE campaign_id = campaign.id AND status IN ('pending','processing')
        ) THEN 'queued'
        WHEN EXISTS (
          SELECT 1 FROM public.generation_queue
          WHERE campaign_id = campaign.id AND status = 'failed'
        ) THEN 'failed'
        ELSE 'completed'
      END;
      UPDATE public.generation_campaigns SET status = next_status, updated_at = now()
      WHERE id = campaign.id;

    WHEN 'retry_failed' THEN
      IF campaign.status IN ('completed','cancelled') THEN
        RAISE EXCEPTION 'Failed jobs cannot be retried for a % campaign', campaign.status USING ERRCODE = '22023';
      END IF;
      UPDATE public.generation_queue
      SET status = 'pending', attempts = 0, claimed_at = NULL,
          completed_at = NULL, last_error = NULL
      WHERE campaign_id = campaign.id AND status = 'failed';
      GET DIAGNOSTICS affected_jobs = ROW_COUNT;
      next_status := CASE
        WHEN NOT campaign.planning_complete THEN 'planning'
        WHEN affected_jobs > 0 OR EXISTS (
          SELECT 1 FROM public.generation_queue
          WHERE campaign_id = campaign.id AND status IN ('pending','processing')
        ) THEN 'queued'
        ELSE 'completed'
      END;
      UPDATE public.generation_campaigns SET status = next_status, updated_at = now()
      WHERE id = campaign.id;

    WHEN 'cancel' THEN
      IF campaign.status = 'completed' THEN
        RAISE EXCEPTION 'A completed campaign cannot be cancelled' USING ERRCODE = '22023';
      END IF;
      UPDATE public.generation_queue
      SET status = 'cancelled', completed_at = now(), last_error = 'Campaign cancelled by administrator'
      WHERE campaign_id = campaign.id AND status IN ('pending','processing');
      GET DIAGNOSTICS affected_jobs = ROW_COUNT;
      UPDATE public.generation_campaigns SET status = 'cancelled', updated_at = now()
      WHERE id = campaign.id;
      next_status := 'cancelled';

    ELSE
      RAISE EXCEPTION 'Unsupported campaign action: %', _action USING ERRCODE = '22023';
  END CASE;

  RETURN jsonb_build_object(
    'campaign_id', campaign.id,
    'action', lower(_action),
    'campaign_status', next_status,
    'affected_queue_jobs', affected_jobs
  );
END;
$$;

REVOKE ALL ON FUNCTION public.manage_generation_campaign(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_generation_campaign(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_generation_campaign_status(_campaign_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign public.generation_campaigns%ROWTYPE;
  queue_metrics jsonb;
  generated integer;
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

  SELECT coalesce(sum(generated_count), 0)::integer,
    jsonb_build_object(
      'queue_pending', count(*) FILTER (WHERE status = 'pending'),
      'queue_processing', count(*) FILTER (WHERE status = 'processing'),
      'queue_done', count(*) FILTER (WHERE status = 'done'),
      'queue_failed', count(*) FILTER (WHERE status = 'failed'),
      'queue_cancelled', count(*) FILTER (WHERE status = 'cancelled'),
      'queued_questions', coalesce(sum(count), 0),
      'generated', coalesce(sum(generated_count), 0),
      'queue_completion_pct', CASE WHEN count(*) > 0
        THEN round((count(*) FILTER (WHERE status = 'done'))::numeric / count(*)::numeric * 100, 1)
        ELSE 0 END
    )
  INTO generated, queue_metrics
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
    'generation_remaining', greatest(campaign.target_questions - generated, 0),
    'review_backlog', greatest(generated - campaign.reviewed_questions, 0),
    'review_yield_pct', CASE WHEN campaign.reviewed_questions > 0
      THEN round(campaign.published_questions::numeric / campaign.reviewed_questions::numeric * 100, 1)
      ELSE 0 END,
    'progress_pct', CASE WHEN campaign.target_questions > 0
      THEN round(generated::numeric / campaign.target_questions::numeric * 100, 1)
      ELSE 0 END,
    'created_at', campaign.created_at,
    'updated_at', campaign.updated_at
  ) || queue_metrics;
END;
$$;

REVOKE ALL ON FUNCTION public.get_generation_campaign_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_generation_campaign_status(uuid) TO authenticated, service_role;