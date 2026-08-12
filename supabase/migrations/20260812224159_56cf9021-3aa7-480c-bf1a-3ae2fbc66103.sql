
CREATE OR REPLACE FUNCTION public.assert_self(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN;
  END IF;
  IF auth.uid() IS NULL OR _user_id IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_self(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_self(uuid) TO authenticated, service_role;

-- record_answer_stats
CREATE OR REPLACE FUNCTION public.record_answer_stats(_user_id uuid, _correct boolean, _xp_gain integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _existing RECORD;
  _today date := CURRENT_DATE;
  _yesterday date := CURRENT_DATE - 1;
  _new_streak integer;
  _new_xp integer;
  _new_level integer;
  _new_longest integer;
BEGIN
  PERFORM public.assert_self(_user_id);
  IF _xp_gain IS NULL OR _xp_gain < 0 OR _xp_gain > 200 THEN
    RAISE EXCEPTION 'Invalid xp gain' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _existing FROM user_stats WHERE user_id = _user_id;

  IF _existing IS NULL THEN
    _new_streak := 1;
    _new_xp := _xp_gain;
    _new_level := FLOOR(_new_xp / 500) + 1;
    INSERT INTO user_stats (user_id, xp, level, streak, longest_streak, total_questions, correct_answers, last_active_date)
    VALUES (_user_id, _new_xp, _new_level, 1, 1, 1, CASE WHEN _correct THEN 1 ELSE 0 END, _today);
  ELSE
    IF _existing.last_active_date = _today THEN
      _new_streak := _existing.streak;
    ELSIF _existing.last_active_date = _yesterday THEN
      _new_streak := _existing.streak + 1;
    ELSE
      _new_streak := 1;
    END IF;

    _new_xp := _existing.xp + _xp_gain;
    _new_level := FLOOR(_new_xp / 500) + 1;
    _new_longest := GREATEST(_new_streak, _existing.longest_streak);

    UPDATE user_stats SET
      xp = _new_xp,
      level = _new_level,
      streak = _new_streak,
      longest_streak = _new_longest,
      total_questions = _existing.total_questions + 1,
      correct_answers = _existing.correct_answers + CASE WHEN _correct THEN 1 ELSE 0 END,
      last_active_date = _today,
      updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  RETURN jsonb_build_object('xp', _new_xp, 'level', _new_level, 'streak', _new_streak, 'longest_streak', _new_longest);
END;
$function$;

-- record_perfect_score
CREATE OR REPLACE FUNCTION public.record_perfect_score(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  UPDATE user_stats SET perfect_scores = perfect_scores + 1, updated_at = now()
  WHERE user_id = _user_id;
END;
$function$;

-- award_badge
CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _badge_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _badge RECORD;
  _stats RECORD;
  _earned boolean := false;
  _acc numeric;
BEGIN
  PERFORM public.assert_self(_user_id);

  SELECT * INTO _badge FROM badges WHERE id = _badge_id;
  IF _badge IS NULL THEN RETURN false; END IF;

  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = _badge_id) THEN
    RETURN false;
  END IF;

  SELECT * INTO _stats FROM user_stats WHERE user_id = _user_id;
  IF _stats IS NULL THEN RETURN false; END IF;

  CASE _badge.requirement_type
    WHEN 'questions_answered' THEN
      _earned := _stats.total_questions >= _badge.requirement_value;
    WHEN 'streak' THEN
      _earned := _stats.streak >= _badge.requirement_value;
    WHEN 'accuracy' THEN
      IF _stats.total_questions >= 10 THEN
        _acc := (_stats.correct_answers::numeric / _stats.total_questions) * 100;
        _earned := _acc >= _badge.requirement_value;
      END IF;
    WHEN 'perfect_score' THEN
      _earned := _stats.perfect_scores >= _badge.requirement_value;
    WHEN 'xp' THEN
      _earned := _stats.xp >= _badge.requirement_value;
    ELSE
      _earned := false;
  END CASE;

  IF _earned THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (_user_id, _badge_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$function$;

-- increment_used_questions
CREATE OR REPLACE FUNCTION public.increment_used_questions(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  UPDATE user_quotas
  SET used_questions = used_questions + 1, updated_at = now()
  WHERE user_id = _user_id AND used_questions < total_questions;
END;
$function$;

-- increment_mock_exams_used
CREATE OR REPLACE FUNCTION public.increment_mock_exams_used(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  UPDATE user_quotas
  SET mock_exams_used = mock_exams_used + 1, updated_at = now()
  WHERE user_id = _user_id AND mock_exams_used < mock_exams_total;
END;
$function$;

-- issue_certificate
CREATE OR REPLACE FUNCTION public.issue_certificate(_user_id uuid, _title text, _subject text, _achievement_type text, _score_percent integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _stats RECORD;
  _cert_id uuid;
BEGIN
  PERFORM public.assert_self(_user_id);

  SELECT * INTO _stats FROM user_stats WHERE user_id = _user_id;
  IF _stats IS NULL THEN
    RAISE EXCEPTION 'No stats found for user';
  END IF;

  IF _score_percent < 0 OR _score_percent > 100 THEN
    RAISE EXCEPTION 'Invalid score percent';
  END IF;

  IF _stats.total_questions < 5 THEN
    RAISE EXCEPTION 'Insufficient activity to earn certificate';
  END IF;

  INSERT INTO certificates (user_id, title, subject, achievement_type, score_percent)
  VALUES (_user_id, left(_title, 200), left(_subject, 100), left(_achievement_type, 50), _score_percent)
  RETURNING id INTO _cert_id;

  RETURN _cert_id;
END;
$function$;

-- register_session
CREATE OR REPLACE FUNCTION public.register_session(_user_id uuid, _session_token text, _device_info text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  DELETE FROM active_sessions WHERE user_id = _user_id;
  INSERT INTO active_sessions (user_id, session_token, device_info, last_active)
  VALUES (_user_id, _session_token, _device_info, now());
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- validate_session
CREATE OR REPLACE FUNCTION public.validate_session(_user_id uuid, _session_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  RETURN EXISTS (
    SELECT 1 FROM active_sessions
    WHERE user_id = _user_id AND session_token = _session_token
  );
END;
$function$;

-- get_free_usage
CREATE OR REPLACE FUNCTION public.get_free_usage(_user_id uuid)
 RETURNS TABLE(subject text, attempt_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self(_user_id);
  RETURN QUERY
  SELECT q.subject, count(*) AS attempt_count
  FROM attempts a
  JOIN questions q ON a.question_id = q.id
  WHERE a.user_id = _user_id
  GROUP BY q.subject;
END;
$function$;

-- confirm_subject_selection
CREATE OR REPLACE FUNCTION public.confirm_subject_selection(_user_id uuid, _subjects text[], _levels text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _current_total integer;
  _existing_subjects text[];
  _existing_levels text[];
  _subject_count integer;
  _level_count integer;
BEGIN
  PERFORM public.assert_self(_user_id);

  SELECT total_questions, subjects, levels INTO _current_total, _existing_subjects, _existing_levels
  FROM user_quotas WHERE user_id = _user_id;

  IF _current_total IS NULL OR _current_total = 0 THEN
    RETURN jsonb_build_object('error', 'No purchase found');
  END IF;

  _subject_count := array_length(_subjects, 1);
  _level_count := array_length(_levels, 1);

  IF _subject_count IS NULL OR _subject_count = 0 OR _level_count IS NULL OR _level_count = 0 THEN
    RETURN jsonb_build_object('error', 'Must select at least one subject and one level');
  END IF;

  IF _existing_subjects IS NOT NULL AND array_length(_existing_subjects, 1) > 0 THEN
    UPDATE user_quotas
    SET subjects = (SELECT ARRAY(SELECT DISTINCT unnest FROM unnest(_existing_subjects || _subjects))),
        levels = (SELECT ARRAY(SELECT DISTINCT unnest FROM unnest(_existing_levels || _levels))),
        updated_at = now()
    WHERE user_id = _user_id;
  ELSE
    UPDATE user_quotas
    SET subjects = _subjects, levels = _levels, updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  INSERT INTO user_preferences (user_id, subjects, onboarding_complete)
  VALUES (_user_id, _subjects, true)
  ON CONFLICT (user_id) DO UPDATE
  SET subjects = EXCLUDED.subjects, onboarding_complete = true, updated_at = now();

  INSERT INTO user_stats (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true, 'total_questions', _current_total);
END;
$function$;

-- Lock down the developer quota grant entirely
REVOKE ALL ON FUNCTION public.grant_dev_quota(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_dev_quota(uuid) TO service_role;

-- Deny anonymous execution of user-scoped functions
REVOKE ALL ON FUNCTION public.record_answer_stats(uuid, boolean, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_perfect_score(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.award_badge(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_used_questions(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.increment_mock_exams_used(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.issue_certificate(uuid, text, text, text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_session(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.validate_session(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_free_usage(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_subject_selection(uuid, text[], text[]) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.record_answer_stats(uuid, boolean, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_perfect_score(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_badge(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_used_questions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_mock_exams_used(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid, text, text, text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_session(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_session(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_free_usage(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_subject_selection(uuid, text[], text[]) TO authenticated, service_role;
