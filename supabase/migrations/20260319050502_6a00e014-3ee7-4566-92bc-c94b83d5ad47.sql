CREATE OR REPLACE FUNCTION public.confirm_subject_selection(
  _user_id uuid,
  _subjects text[],
  _levels text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _current_total integer;
  _subject_count integer;
  _level_count integer;
BEGIN
  SELECT total_questions INTO _current_total
  FROM user_quotas
  WHERE user_id = _user_id;

  IF _current_total IS NULL OR _current_total = 0 THEN
    RETURN jsonb_build_object('error', 'No purchase found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM user_quotas
    WHERE user_id = _user_id
      AND array_length(subjects, 1) > 0
  ) THEN
    RETURN jsonb_build_object('error', 'Subjects already selected');
  END IF;

  _subject_count := array_length(_subjects, 1);
  _level_count := array_length(_levels, 1);

  IF _subject_count IS NULL OR _subject_count = 0 OR _level_count IS NULL OR _level_count = 0 THEN
    RETURN jsonb_build_object('error', 'Must select at least one subject and one level');
  END IF;

  UPDATE user_quotas
  SET subjects = _subjects,
      levels = _levels,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO user_preferences (user_id, subjects, onboarding_complete)
  VALUES (_user_id, _subjects, true)
  ON CONFLICT (user_id) DO UPDATE
  SET subjects = _subjects, onboarding_complete = true, updated_at = now();

  INSERT INTO user_stats (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'total_questions', _current_total
  );
END;
$$;