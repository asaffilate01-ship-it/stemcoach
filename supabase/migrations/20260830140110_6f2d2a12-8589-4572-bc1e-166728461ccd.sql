-- Persistent, curriculum-aware learner mastery and secure adaptive question selection.
CREATE TABLE IF NOT EXISTS public.learner_topic_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum text NOT NULL,
  subject text NOT NULL,
  topic text NOT NULL,
  mastery_score numeric(5,2) NOT NULL DEFAULT 50 CHECK (mastery_score BETWEEN 0 AND 100),
  confidence_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  correct_attempts integer NOT NULL DEFAULT 0 CHECK (correct_attempts BETWEEN 0 AND attempts),
  correct_streak integer NOT NULL DEFAULT 0 CHECK (correct_streak >= 0),
  last_question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  last_practised_at timestamptz,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_topic_mastery_unique UNIQUE (user_id, curriculum, subject, topic)
);

CREATE INDEX IF NOT EXISTS learner_mastery_user_due_idx
  ON public.learner_topic_mastery(user_id, next_review_at, mastery_score);
CREATE INDEX IF NOT EXISTS learner_mastery_subject_idx
  ON public.learner_topic_mastery(user_id, curriculum, subject, topic);

ALTER TABLE public.learner_topic_mastery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners view own mastery" ON public.learner_topic_mastery;
CREATE POLICY "Learners view own mastery" ON public.learner_topic_mastery
  FOR SELECT TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public.learner_topic_mastery FROM PUBLIC, anon;
GRANT SELECT ON public.learner_topic_mastery TO authenticated;
GRANT ALL ON public.learner_topic_mastery TO service_role;

-- Retire legacy learner policies that could expose canonical answers from the
-- base question table. Learners use questions_safe or the adaptive RPC; admin,
-- teacher and reviewer policies remain independently in force.
DROP POLICY IF EXISTS "Paid users can read questions" ON public.questions;
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;

-- Attempts are authoritative learning evidence. Browsers submit answers through
-- the answer-checking Edge Functions; they cannot self-declare a correct result.
REVOKE INSERT, UPDATE, DELETE ON public.attempts FROM authenticated;

CREATE OR REPLACE FUNCTION public.update_learner_topic_mastery(
  _user_id uuid,
  _question_id uuid,
  _correct boolean,
  _time_taken_seconds integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.questions%ROWTYPE;
  current_row public.learner_topic_mastery%ROWTYPE;
  score_before numeric := 50;
  score_after numeric;
  score_delta numeric;
  new_attempts integer;
  new_correct integer;
  new_streak integer;
  new_confidence numeric;
  review_at timestamptz;
  level_name text;
BEGIN
  IF _user_id IS NULL OR _question_id IS NULL OR _correct IS NULL THEN
    RAISE EXCEPTION 'User, question and result are required' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO q
  FROM public.questions
  WHERE id = _question_id AND review_status = 'published';
  IF q.id IS NULL THEN
    RAISE EXCEPTION 'Published question not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO current_row
  FROM public.learner_topic_mastery mastery
  WHERE mastery.user_id = _user_id
    AND mastery.curriculum = q.curriculum
    AND mastery.subject = q.subject
    AND mastery.topic = q.topic
  FOR UPDATE;

  IF current_row.id IS NOT NULL THEN score_before := current_row.mastery_score; END IF;
  score_delta := CASE
    WHEN _correct THEN 6 + (q.difficulty * 1.4) + LEAST(coalesce(current_row.correct_streak, 0), 4) * 0.5
    ELSE -(8 + ((6 - q.difficulty) * 1.2))
  END;
  score_after := round(LEAST(100, GREATEST(0, score_before + score_delta)), 2);
  new_attempts := coalesce(current_row.attempts, 0) + 1;
  new_correct := coalesce(current_row.correct_attempts, 0) + CASE WHEN _correct THEN 1 ELSE 0 END;
  new_streak := CASE WHEN _correct THEN coalesce(current_row.correct_streak, 0) + 1 ELSE 0 END;
  new_confidence := round(LEAST(100, new_attempts * 8)::numeric, 2);

  review_at := now() + CASE
    WHEN NOT _correct THEN interval '4 hours'
    WHEN score_after >= 90 AND new_streak >= 4 THEN interval '30 days'
    WHEN score_after >= 80 THEN interval '14 days'
    WHEN score_after >= 65 THEN interval '7 days'
    WHEN score_after >= 50 THEN interval '3 days'
    ELSE interval '1 day'
  END;
  level_name := CASE
    WHEN score_after >= 90 AND new_confidence >= 60 THEN 'mastered'
    WHEN score_after >= 75 AND new_confidence >= 40 THEN 'secure'
    WHEN new_attempts >= 2 THEN 'developing'
    ELSE 'new'
  END;

  INSERT INTO public.learner_topic_mastery (
    user_id, curriculum, subject, topic, mastery_score, confidence_score,
    attempts, correct_attempts, correct_streak, last_question_id,
    last_practised_at, next_review_at, updated_at
  ) VALUES (
    _user_id, q.curriculum, q.subject, q.topic, score_after, new_confidence,
    new_attempts, new_correct, new_streak, q.id,
    now(), review_at, now()
  )
  ON CONFLICT (user_id, curriculum, subject, topic) DO UPDATE SET
    mastery_score = excluded.mastery_score,
    confidence_score = excluded.confidence_score,
    attempts = excluded.attempts,
    correct_attempts = excluded.correct_attempts,
    correct_streak = excluded.correct_streak,
    last_question_id = excluded.last_question_id,
    last_practised_at = excluded.last_practised_at,
    next_review_at = excluded.next_review_at,
    updated_at = now();

  RETURN jsonb_build_object(
    'curriculum', q.curriculum,
    'subject', q.subject,
    'topic', q.topic,
    'score_before', score_before,
    'score_after', score_after,
    'score_delta', round(score_after - score_before, 2),
    'confidence_score', new_confidence,
    'attempts', new_attempts,
    'level', level_name,
    'next_review_at', review_at,
    'response_time_seconds', CASE WHEN _time_taken_seconds IS NULL THEN NULL ELSE GREATEST(0, LEAST(_time_taken_seconds, 86400)) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_learner_topic_mastery(uuid, uuid, boolean, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_learner_topic_mastery(uuid, uuid, boolean, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_adaptive_practice_questions(
  _subject text,
  _curriculum text DEFAULT NULL,
  _mode text DEFAULT 'mixed',
  _count integer DEFAULT 30
)
RETURNS TABLE (
  id uuid,
  question_text text,
  options jsonb,
  allow_multiple_answers boolean,
  question_type text,
  subject text,
  topic text,
  subtopic text,
  difficulty integer,
  points integer,
  max_marks integer,
  boards text[],
  formula text,
  command_word text,
  curriculum text,
  mastery_score numeric,
  next_review_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_mode text := lower(coalesce(_mode, 'mixed'));
  safe_count integer := LEAST(GREATEST(coalesce(_count, 30), 5), 50);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF nullif(trim(_subject), '') IS NULL THEN
    RAISE EXCEPTION 'Subject is required' USING ERRCODE = '22023';
  END IF;
  IF safe_mode NOT IN ('diagnostic', 'focus', 'mixed') THEN
    RAISE EXCEPTION 'Unsupported practice mode' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      q.id, q.question_text, q.options, q.allow_multiple_answers,
      q.question_type, q.subject, q.topic, q.subtopic, q.difficulty,
      q.points, q.max_marks, q.boards, q.formula, q.command_word, q.curriculum,
      coalesce(mastery.mastery_score, 50)::numeric AS mastery_score,
      mastery.next_review_at,
      CASE safe_mode
        WHEN 'diagnostic' THEN CASE WHEN mastery.id IS NULL THEN 0 ELSE 2 END
        WHEN 'focus' THEN CASE
          WHEN mastery.next_review_at <= now() THEN 0
          WHEN coalesce(mastery.mastery_score, 50) < 60 THEN 1
          ELSE 3
        END
        ELSE CASE
          WHEN mastery.next_review_at <= now() THEN 0
          WHEN mastery.id IS NULL THEN 1
          WHEN mastery.mastery_score < 70 THEN 2
          ELSE 3
        END
      END AS priority,
      CASE WHEN recent.last_attempt_at >= now() - interval '6 hours' THEN 1 ELSE 0 END AS recently_seen,
      row_number() OVER (
        PARTITION BY q.topic
        ORDER BY
          CASE WHEN recent.last_attempt_at >= now() - interval '6 hours' THEN 1 ELSE 0 END,
          abs(q.difficulty - LEAST(5, GREATEST(1, ceil(coalesce(mastery.mastery_score, 50) / 20.0)::integer))),
          random()
      ) AS topic_rank
    FROM public.questions q
    LEFT JOIN public.learner_topic_mastery mastery
      ON mastery.user_id = auth.uid()
      AND mastery.curriculum = q.curriculum
      AND mastery.subject = q.subject
      AND mastery.topic = q.topic
    LEFT JOIN LATERAL (
      SELECT max(attempt.created_at) AS last_attempt_at
      FROM public.attempts attempt
      WHERE attempt.user_id = auth.uid() AND attempt.question_id = q.id
    ) recent ON true
    WHERE q.review_status = 'published'
      AND q.subject = trim(_subject)
      AND (_curriculum IS NULL OR q.curriculum = _curriculum)
  )
  SELECT
    candidate.id, candidate.question_text, candidate.options, candidate.allow_multiple_answers,
    candidate.question_type, candidate.subject, candidate.topic, candidate.subtopic,
    candidate.difficulty, candidate.points, candidate.max_marks, candidate.boards,
    candidate.formula, candidate.command_word, candidate.curriculum,
    candidate.mastery_score, candidate.next_review_at
  FROM candidates candidate
  WHERE candidate.topic_rank <= 6
  ORDER BY candidate.priority, candidate.recently_seen, candidate.mastery_score, random()
  LIMIT safe_count;
END;
$$;

REVOKE ALL ON FUNCTION public.get_adaptive_practice_questions(text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_adaptive_practice_questions(text, text, text, integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_learner_mastery_dashboard(
  _curriculum text DEFAULT NULL
)
RETURNS TABLE (
  curriculum text,
  subject text,
  topic text,
  mastery_score numeric,
  confidence_score numeric,
  attempts integer,
  correct_attempts integer,
  correct_streak integer,
  last_practised_at timestamptz,
  next_review_at timestamptz,
  mastery_level text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    mastery.curriculum,
    mastery.subject,
    mastery.topic,
    mastery.mastery_score,
    mastery.confidence_score,
    mastery.attempts,
    mastery.correct_attempts,
    mastery.correct_streak,
    mastery.last_practised_at,
    mastery.next_review_at,
    CASE
      WHEN mastery.mastery_score >= 90 AND mastery.confidence_score >= 60 THEN 'mastered'
      WHEN mastery.mastery_score >= 75 AND mastery.confidence_score >= 40 THEN 'secure'
      WHEN mastery.attempts >= 2 THEN 'developing'
      ELSE 'new'
    END
  FROM public.learner_topic_mastery mastery
  WHERE mastery.user_id = auth.uid()
    AND (_curriculum IS NULL OR mastery.curriculum = _curriculum)
  ORDER BY
    CASE WHEN mastery.next_review_at <= now() THEN 0 ELSE 1 END,
    mastery.mastery_score,
    mastery.subject,
    mastery.topic;
END;
$$;

REVOKE ALL ON FUNCTION public.get_learner_mastery_dashboard(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_learner_mastery_dashboard(text) TO authenticated, service_role;

-- Seed existing learners with a confidence-weighted Bayesian score so the new
-- dashboard starts from their real history rather than discarding it.
INSERT INTO public.learner_topic_mastery (
  user_id, curriculum, subject, topic, mastery_score, confidence_score,
  attempts, correct_attempts, correct_streak, last_question_id,
  last_practised_at, next_review_at
)
SELECT
  attempt.user_id,
  q.curriculum,
  q.subject,
  q.topic,
  round(((count(*) FILTER (WHERE attempt.correct) + 2) * 100.0 / (count(*) + 4))::numeric, 2),
  LEAST(100, count(*) * 8)::numeric,
  count(*)::integer,
  count(*) FILTER (WHERE attempt.correct)::integer,
  0,
  (array_agg(attempt.question_id ORDER BY attempt.created_at DESC))[1],
  max(attempt.created_at),
  CASE
    WHEN count(*) FILTER (WHERE attempt.correct) * 1.0 / count(*) < 0.6 THEN now()
    ELSE now() + interval '3 days'
  END
FROM public.attempts attempt
JOIN public.questions q ON q.id = attempt.question_id
WHERE q.review_status = 'published'
GROUP BY attempt.user_id, q.curriculum, q.subject, q.topic
ON CONFLICT (user_id, curriculum, subject, topic) DO NOTHING;