CREATE OR REPLACE FUNCTION public.get_or_create_daily_challenge(_subject text, _curriculum text DEFAULT 'uk-gcse')
RETURNS TABLE(id uuid, date date, subject text, curriculum text, question_count integer, time_limit_seconds integer, xp_reward integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := CURRENT_DATE;
  _row public.daily_challenges%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _row FROM public.daily_challenges dc
  WHERE dc.date = _today AND dc.subject = _subject AND dc.curriculum = _curriculum
  LIMIT 1;

  IF _row.id IS NULL THEN
    INSERT INTO public.daily_challenges (date, subject, curriculum, question_count, time_limit_seconds, xp_reward)
    VALUES (_today, _subject, _curriculum, 10, 600, 150)
    RETURNING * INTO _row;
  END IF;

  RETURN QUERY SELECT _row.id, _row.date, _row.subject, _row.curriculum, _row.question_count, _row.time_limit_seconds, _row.xp_reward;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_challenge_leaderboard(_challenge_id uuid)
RETURNS TABLE(user_id uuid, display_name text, score integer, total integer, time_taken_seconds integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.user_id, p.display_name, a.score, a.total, a.time_taken_seconds
  FROM public.daily_challenge_attempts a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  WHERE auth.uid() IS NOT NULL AND a.challenge_id = _challenge_id
  ORDER BY a.score DESC, COALESCE(a.time_taken_seconds, 999999) ASC
  LIMIT 10
$$;

CREATE OR REPLACE FUNCTION public.get_my_challenge_summary()
RETURNS TABLE(completed integer, best_score integer, total_xp integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(count(*),0)::int,
         COALESCE(max(a.score),0)::int,
         COALESCE(sum(a.score * 15),0)::int
  FROM public.daily_challenge_attempts a
  WHERE auth.uid() IS NOT NULL AND a.user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.record_daily_challenge_attempt(_challenge_id uuid, _score integer, _total integer, _time_taken_seconds integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _limit integer;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT question_count INTO _limit FROM public.daily_challenges WHERE id = _challenge_id;
  IF _limit IS NULL THEN
    RAISE EXCEPTION 'Unknown challenge' USING ERRCODE = '22023';
  END IF;

  IF _total IS NULL OR _total < 1 OR _total > _limit
     OR _score IS NULL OR _score < 0 OR _score > _total
     OR _time_taken_seconds IS NULL OR _time_taken_seconds < 0 OR _time_taken_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid result' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.daily_challenge_attempts WHERE challenge_id = _challenge_id AND user_id = _uid) THEN
    RETURN jsonb_build_object('already_completed', true);
  END IF;

  INSERT INTO public.daily_challenge_attempts (challenge_id, user_id, score, total, time_taken_seconds)
  VALUES (_challenge_id, _uid, _score, _total, _time_taken_seconds);

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_daily_challenge(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_daily_challenge_leaderboard(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_challenge_summary() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_daily_challenge_attempt(uuid, integer, integer, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_or_create_daily_challenge(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_challenge_leaderboard(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_challenge_summary() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_daily_challenge_attempt(uuid, integer, integer, integer) TO authenticated, service_role;