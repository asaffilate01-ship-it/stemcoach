
-- ============================================================
-- FIX 1: Protect question answers from direct DB access
-- Create a view that strips answer columns for students
-- ============================================================

-- Create a safe view for student question access
CREATE OR REPLACE VIEW public.questions_safe AS
SELECT
  id, question_text, options, allow_multiple_answers,
  question_type, subject, topic, subtopic, difficulty,
  points, max_marks, boards, formula, command_word, curriculum, created_at
FROM public.questions;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;

-- Re-add SELECT only for admins and teachers
CREATE POLICY "Admins and teachers can read full questions"
ON public.questions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'teacher')
);

-- Grant SELECT on the safe view to authenticated users
GRANT SELECT ON public.questions_safe TO authenticated;

-- ============================================================
-- FIX 2: Lock down user_stats — move updates to server-side
-- ============================================================

-- Drop the permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_stats;

-- Create a SECURITY DEFINER function for recording answers
CREATE OR REPLACE FUNCTION public.record_answer_stats(
  _user_id uuid,
  _correct boolean,
  _xp_gain integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing RECORD;
  _today date := CURRENT_DATE;
  _yesterday date := CURRENT_DATE - 1;
  _new_streak integer;
  _new_xp integer;
  _new_level integer;
  _new_longest integer;
BEGIN
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

  RETURN jsonb_build_object(
    'xp', _new_xp,
    'level', _new_level,
    'streak', _new_streak,
    'longest_streak', _new_longest
  );
END;
$$;

-- Create a function for recording perfect scores
CREATE OR REPLACE FUNCTION public.record_perfect_score(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_stats SET perfect_scores = perfect_scores + 1, updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- ============================================================
-- FIX 3: Close mock exam quota bypass
-- Already protected for total_questions/used_questions.
-- Now also protect mock_exams_total and mock_exams_used.
-- ============================================================

DROP POLICY IF EXISTS "Users can update own quota subjects and levels only" ON public.user_quotas;

CREATE POLICY "Users can update own quota subjects and levels only"
ON public.user_quotas FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND total_questions = (SELECT uq.total_questions FROM user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
  AND used_questions = (SELECT uq.used_questions FROM user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
  AND mock_exams_total = (SELECT uq.mock_exams_total FROM user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
  AND mock_exams_used = (SELECT uq.mock_exams_used FROM user_quotas uq WHERE uq.user_id = auth.uid() LIMIT 1)
);

-- ============================================================
-- FIX 4: Prevent badge self-granting
-- Move badge awarding to a SECURITY DEFINER function
-- ============================================================

DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;

-- Create a SECURITY DEFINER function for awarding badges
CREATE OR REPLACE FUNCTION public.award_badge(_user_id uuid, _badge_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _badge RECORD;
  _stats RECORD;
  _earned boolean := false;
  _acc numeric;
BEGIN
  -- Check badge exists
  SELECT * INTO _badge FROM badges WHERE id = _badge_id;
  IF _badge IS NULL THEN RETURN false; END IF;

  -- Check not already earned
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = _user_id AND badge_id = _badge_id) THEN
    RETURN false;
  END IF;

  -- Get user stats
  SELECT * INTO _stats FROM user_stats WHERE user_id = _user_id;
  IF _stats IS NULL THEN RETURN false; END IF;

  -- Validate the badge requirement is actually met
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
$$;
