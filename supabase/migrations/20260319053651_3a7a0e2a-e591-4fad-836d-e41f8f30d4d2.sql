
-- Add mock exam columns to user_quotas
ALTER TABLE user_quotas ADD COLUMN IF NOT EXISTS mock_exams_total integer NOT NULL DEFAULT 0;
ALTER TABLE user_quotas ADD COLUMN IF NOT EXISTS mock_exams_used integer NOT NULL DEFAULT 0;

-- Allow free tier: all authenticated users can read questions
DROP POLICY IF EXISTS "Paid users can read questions" ON questions;
CREATE POLICY "Authenticated users can read questions" ON questions
  FOR SELECT TO authenticated USING (true);

-- Coaching response cache table
CREATE TABLE IF NOT EXISTS coaching_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'explain',
  response_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  hit_count integer NOT NULL DEFAULT 0,
  UNIQUE(question_id, action)
);
ALTER TABLE coaching_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read cache" ON coaching_cache FOR SELECT TO authenticated USING (true);

-- Function to increment mock exams used
CREATE OR REPLACE FUNCTION public.increment_mock_exams_used(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE user_quotas
  SET mock_exams_used = mock_exams_used + 1, updated_at = now()
  WHERE user_id = _user_id AND mock_exams_used < mock_exams_total;
END;
$$;

-- Function to get free tier usage per subject
CREATE OR REPLACE FUNCTION public.get_free_usage(_user_id uuid)
RETURNS TABLE(subject text, attempt_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT q.subject, count(*) as attempt_count
  FROM attempts a
  JOIN questions q ON a.question_id = q.id
  WHERE a.user_id = _user_id
  GROUP BY q.subject;
$$;

-- Update confirm_subject_selection to support top-up stacking
CREATE OR REPLACE FUNCTION public.confirm_subject_selection(_user_id uuid, _subjects text[], _levels text[])
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _current_total integer;
  _existing_subjects text[];
  _existing_levels text[];
  _subject_count integer;
  _level_count integer;
BEGIN
  SELECT total_questions, subjects, levels INTO _current_total, _existing_subjects, _existing_levels
  FROM user_quotas
  WHERE user_id = _user_id;

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
    SET subjects = _subjects,
        levels = _levels,
        updated_at = now()
    WHERE user_id = _user_id;
  END IF;

  INSERT INTO user_preferences (user_id, subjects, onboarding_complete)
  VALUES (_user_id, _subjects, true)
  ON CONFLICT (user_id) DO UPDATE
  SET subjects = EXCLUDED.subjects,
      onboarding_complete = true,
      updated_at = now();

  INSERT INTO user_stats (user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'total_questions', _current_total
  );
END;
$$;
