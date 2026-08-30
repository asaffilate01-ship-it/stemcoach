-- Persist tutorial continuity across devices and make the AI coach rate limit
-- effective across all Edge Function instances.

CREATE TABLE IF NOT EXISTS public.user_tutorial_progress (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id text NOT NULL,
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tutorial_id),
  CONSTRAINT user_tutorial_progress_id_check
    CHECK (tutorial_id ~ '^[a-z0-9][a-z0-9-]{0,79}$')
);

ALTER TABLE public.user_tutorial_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_tutorial_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_tutorial_progress TO authenticated;
GRANT ALL ON public.user_tutorial_progress TO service_role;

DROP POLICY IF EXISTS "Users read own tutorial progress" ON public.user_tutorial_progress;
CREATE POLICY "Users read own tutorial progress"
  ON public.user_tutorial_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS user_tutorial_progress_recent_idx
  ON public.user_tutorial_progress(user_id, last_opened_at DESC);

CREATE OR REPLACE FUNCTION public.save_tutorial_progress(
  _tutorial_id text,
  _completed boolean DEFAULT false
)
RETURNS public.user_tutorial_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  clean_id text := lower(trim(coalesce(_tutorial_id, '')));
  saved public.user_tutorial_progress%ROWTYPE;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF clean_id !~ '^[a-z0-9][a-z0-9-]{0,79}$' THEN
    RAISE EXCEPTION 'Invalid tutorial identifier' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_tutorial_progress(
    user_id, tutorial_id, last_opened_at, completed_at, updated_at
  ) VALUES (
    actor, clean_id, now(), CASE WHEN _completed THEN now() ELSE NULL END, now()
  )
  ON CONFLICT (user_id, tutorial_id) DO UPDATE
    SET last_opened_at = now(),
        completed_at = CASE
          WHEN _completed THEN coalesce(user_tutorial_progress.completed_at, now())
          ELSE user_tutorial_progress.completed_at
        END,
        updated_at = now()
  RETURNING * INTO saved;

  RETURN saved;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_tutorial_completions(_tutorial_ids text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  synced integer := 0;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF coalesce(cardinality(_tutorial_ids), 0) > 100 OR EXISTS (
    SELECT 1 FROM unnest(coalesce(_tutorial_ids, ARRAY[]::text[])) AS supplied(id)
    WHERE supplied.id !~ '^[a-z0-9][a-z0-9-]{0,79}$'
  ) THEN
    RAISE EXCEPTION 'Invalid tutorial identifiers' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.user_tutorial_progress(
    user_id, tutorial_id, last_opened_at, completed_at, updated_at
  )
  SELECT actor, supplied.id, now(), now(), now()
  FROM (
    SELECT DISTINCT lower(trim(id)) AS id
    FROM unnest(coalesce(_tutorial_ids, ARRAY[]::text[])) AS ids(id)
  ) AS supplied
  WHERE supplied.id <> ''
  ON CONFLICT (user_id, tutorial_id) DO UPDATE
    SET completed_at = coalesce(user_tutorial_progress.completed_at, now()),
        updated_at = now();

  GET DIAGNOSTICS synced = ROW_COUNT;
  RETURN synced;
END;
$$;

REVOKE ALL ON FUNCTION public.save_tutorial_progress(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sync_tutorial_completions(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_tutorial_progress(text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_tutorial_completions(text[]) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.coach_request_windows (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_request_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coach_request_windows FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.coach_request_windows TO service_role;

CREATE OR REPLACE FUNCTION public.consume_coach_rate_limit(
  _user_id uuid,
  _max_requests integer DEFAULT 20,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  state public.coach_request_windows%ROWTYPE;
BEGIN
  IF _user_id IS NULL OR _max_requests NOT BETWEEN 1 AND 100
     OR _window_seconds NOT BETWEEN 10 AND 3600 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));
  SELECT * INTO state FROM public.coach_request_windows
  WHERE user_id = _user_id FOR UPDATE;

  IF NOT FOUND OR state.window_started_at <= now() - make_interval(secs => _window_seconds) THEN
    INSERT INTO public.coach_request_windows(user_id, window_started_at, request_count, updated_at)
    VALUES (_user_id, now(), 1, now())
    ON CONFLICT (user_id) DO UPDATE
      SET window_started_at = now(), request_count = 1, updated_at = now();
    RETURN true;
  END IF;

  IF state.request_count >= _max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.coach_request_windows
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = _user_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_coach_rate_limit(uuid, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_coach_rate_limit(uuid, integer, integer)
  TO service_role;