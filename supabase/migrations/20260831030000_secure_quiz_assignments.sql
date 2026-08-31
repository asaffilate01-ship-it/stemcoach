-- Make teacher quiz assignments deterministic, resumable and server graded.
-- Browsers can neither choose assignment questions nor write scores.

CREATE TABLE IF NOT EXISTS public.assignment_questions (
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 50),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assignment_id, question_id),
  UNIQUE (assignment_id, position)
);

CREATE TABLE IF NOT EXISTS public.assignment_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  attempt_id uuid NOT NULL REFERENCES public.attempts(id) ON DELETE RESTRICT,
  submitted_answer text NOT NULL CHECK (length(submitted_answer) BETWEEN 1 AND 2000),
  correct boolean NOT NULL,
  points_earned integer NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  time_taken_seconds integer CHECK (time_taken_seconds BETWEEN 0 AND 86400),
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS assignment_questions_order_idx
  ON public.assignment_questions(assignment_id, position);
CREATE INDEX IF NOT EXISTS assignment_answers_submission_idx
  ON public.assignment_answers(submission_id, answered_at);

ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assignment_questions, public.assignment_answers FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.assignment_questions, public.assignment_answers TO service_role;

-- Deterministically attach reviewed, auto-gradable questions to any legacy
-- assignment that predates this migration. Topic matches are preferred, then
-- the remaining subject/curriculum pool fills the requested count.
INSERT INTO public.assignment_questions(assignment_id, question_id, position)
SELECT assignment.id, selected.id, selected.position::smallint
FROM public.assignments assignment
CROSS JOIN LATERAL (
  SELECT
    ranked.id,
    row_number() OVER (ORDER BY ranked.topic_priority, ranked.sort_key) AS position
  FROM (
    SELECT
      question.id,
      CASE
        WHEN cardinality(assignment.topics) = 0 THEN 0
        WHEN EXISTS (
          SELECT 1 FROM unnest(assignment.topics) AS supplied(topic)
          WHERE lower(trim(supplied.topic)) = lower(question.topic)
        ) THEN 0
        ELSE 1
      END AS topic_priority,
      md5(question.id::text || assignment.id::text) AS sort_key
    FROM public.questions question
    WHERE question.review_status = 'published'
      AND question.subject = assignment.subject
      AND question.curriculum = assignment.curriculum
      AND question.difficulty BETWEEN assignment.difficulty_min AND assignment.difficulty_max
      AND question.question_type NOT IN ('essay', 'multi-step')
    ORDER BY topic_priority, sort_key
    LIMIT LEAST(GREATEST(assignment.question_count, 1), 50)
  ) ranked
) selected
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_questions existing
  WHERE existing.assignment_id = assignment.id
)
ON CONFLICT DO NOTHING;

UPDATE public.assignments assignment
SET question_count = actual.count
FROM (
  SELECT assignment_id, count(*)::integer AS count
  FROM public.assignment_questions
  GROUP BY assignment_id
) actual
WHERE assignment.id = actual.assignment_id
  AND actual.count > 0
  AND assignment.question_count <> actual.count;

CREATE OR REPLACE FUNCTION public.create_quiz_assignment(
  _class_id uuid,
  _title text,
  _description text DEFAULT NULL,
  _topics text[] DEFAULT ARRAY[]::text[],
  _question_count integer DEFAULT 10,
  _difficulty_min integer DEFAULT 1,
  _difficulty_max integer DEFAULT 5,
  _due_date timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  classroom public.classes%ROWTYPE;
  created_assignment_id uuid;
  clean_title text := trim(coalesce(_title, ''));
  clean_description text := nullif(trim(coalesce(_description, '')), '');
  clean_topics text[];
  selected_count integer;
BEGIN
  IF actor IS NULL OR NOT public.has_role(actor, 'teacher') THEN
    RAISE EXCEPTION 'Teacher role required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO classroom
  FROM public.classes
  WHERE id = _class_id AND teacher_id = actor;
  IF classroom.id IS NULL THEN
    RAISE EXCEPTION 'Class not found or not owned by teacher' USING ERRCODE = '42501';
  END IF;

  IF length(clean_title) NOT BETWEEN 1 AND 120
     OR length(coalesce(clean_description, '')) > 1000
     OR _question_count NOT BETWEEN 1 AND 50
     OR _difficulty_min NOT BETWEEN 1 AND 5
     OR _difficulty_max NOT BETWEEN 1 AND 5
     OR _difficulty_min > _difficulty_max
     OR (_due_date IS NOT NULL AND _due_date > now() + interval '2 years') THEN
    RAISE EXCEPTION 'Invalid quiz assignment details' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(topic ORDER BY first_position), ARRAY[]::text[])
  INTO clean_topics
  FROM (
    SELECT lower(trim(supplied.topic)) AS topic, min(supplied.ordinality) AS first_position
    FROM unnest(coalesce(_topics, ARRAY[]::text[])) WITH ORDINALITY AS supplied(topic, ordinality)
    WHERE trim(coalesce(supplied.topic, '')) <> ''
    GROUP BY lower(trim(supplied.topic))
    ORDER BY min(supplied.ordinality)
    LIMIT 20
  ) normalised;

  INSERT INTO public.assignments(
    class_id, teacher_id, title, description, subject, topics, curriculum,
    question_count, difficulty_min, difficulty_max, due_date
  ) VALUES (
    classroom.id, actor, clean_title, clean_description, classroom.subject,
    clean_topics, classroom.curriculum, _question_count, _difficulty_min,
    _difficulty_max, _due_date
  ) RETURNING id INTO created_assignment_id;

  INSERT INTO public.assignment_questions(assignment_id, question_id, position)
  SELECT
    created_assignment_id,
    candidate.id,
    row_number() OVER (ORDER BY candidate.topic_priority, candidate.sort_key)::smallint
  FROM (
    SELECT
      question.id,
      CASE
        WHEN cardinality(clean_topics) = 0 THEN 0
        WHEN lower(question.topic) = ANY(clean_topics) THEN 0
        ELSE 1
      END AS topic_priority,
      random() AS sort_key
    FROM public.questions question
    WHERE question.review_status = 'published'
      AND question.subject = classroom.subject
      AND question.curriculum = classroom.curriculum
      AND question.difficulty BETWEEN _difficulty_min AND _difficulty_max
      AND question.question_type NOT IN ('essay', 'multi-step')
    ORDER BY topic_priority, sort_key
    LIMIT _question_count
  ) candidate;

  GET DIAGNOSTICS selected_count = ROW_COUNT;
  IF selected_count <> _question_count THEN
    RAISE EXCEPTION 'Not enough reviewed questions match this class and difficulty range' USING ERRCODE = 'P0002';
  END IF;

  RETURN created_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_assignment_session(_assignment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  assignment_row public.assignments%ROWTYPE;
  submission_row public.assignment_submissions%ROWTYPE;
  safe_questions jsonb;
  answered_ids jsonb;
  total_questions integer;
  available_questions integer;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT assignment.* INTO assignment_row
  FROM public.assignments assignment
  WHERE assignment.id = _assignment_id
    AND EXISTS (
      SELECT 1 FROM public.class_members member
      WHERE member.class_id = assignment.class_id AND member.user_id = actor
    );
  IF assignment_row.id IS NULL THEN
    RAISE EXCEPTION 'Assignment not found or learner is not enrolled' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer INTO total_questions
  FROM public.assignment_questions
  WHERE assignment_id = assignment_row.id;
  IF total_questions = 0 THEN
    RAISE EXCEPTION 'This assignment has no available reviewed questions' USING ERRCODE = 'P0002';
  END IF;
  SELECT count(*)::integer INTO available_questions
  FROM public.assignment_questions assignment_question
  JOIN public.questions question ON question.id = assignment_question.question_id
  WHERE assignment_question.assignment_id = assignment_row.id
    AND question.review_status = 'published';
  IF available_questions <> total_questions THEN
    RAISE EXCEPTION 'One or more assignment questions are no longer published' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.assignment_submissions(assignment_id, student_id, score, total)
  VALUES (assignment_row.id, actor, 0, total_questions)
  ON CONFLICT (assignment_id, student_id) DO UPDATE
    SET total = CASE
      WHEN assignment_submissions.completed_at IS NULL THEN excluded.total
      ELSE assignment_submissions.total
    END
  RETURNING * INTO submission_row;

  SELECT coalesce(jsonb_agg(answer.question_id ORDER BY answer.answered_at), '[]'::jsonb)
  INTO answered_ids
  FROM public.assignment_answers answer
  WHERE answer.submission_id = submission_row.id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', question.id,
      'question_text', question.question_text,
      'options', question.options,
      'allow_multiple_answers', question.allow_multiple_answers,
      'question_type', question.question_type,
      'subject', question.subject,
      'topic', question.topic,
      'subtopic', question.subtopic,
      'difficulty', question.difficulty,
      'points', question.points,
      'max_marks', question.max_marks,
      'boards', question.boards,
      'formula', question.formula,
      'command_word', question.command_word,
      'curriculum', question.curriculum
    ) ORDER BY assignment_question.position
  ) INTO safe_questions
  FROM public.assignment_questions assignment_question
  JOIN public.questions question ON question.id = assignment_question.question_id
  WHERE assignment_question.assignment_id = assignment_row.id
    AND question.review_status = 'published';

  RETURN jsonb_build_object(
    'assignment', jsonb_build_object(
      'id', assignment_row.id,
      'title', assignment_row.title,
      'description', assignment_row.description,
      'subject', assignment_row.subject,
      'curriculum', assignment_row.curriculum,
      'due_date', assignment_row.due_date,
      'question_count', total_questions
    ),
    'submission', jsonb_build_object(
      'id', submission_row.id,
      'started_at', submission_row.started_at,
      'completed_at', submission_row.completed_at,
      'score', coalesce(submission_row.score, 0),
      'total', coalesce(submission_row.total, total_questions)
    ),
    'answered_question_ids', answered_ids,
    'questions', coalesce(safe_questions, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_assignment_answer(
  _user_id uuid,
  _assignment_id uuid,
  _question_id uuid,
  _submitted_answer text,
  _correct boolean,
  _time_taken_seconds integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  submission_row public.assignment_submissions%ROWTYPE;
  attempt_id uuid;
  question_points integer;
  total_questions integer;
  answered_count integer;
  correct_count integer;
  completed_at_value timestamptz;
BEGIN
  IF _user_id IS NULL OR _assignment_id IS NULL OR _question_id IS NULL
     OR length(trim(coalesce(_submitted_answer, ''))) NOT BETWEEN 1 AND 2000
     OR _correct IS NULL THEN
    RAISE EXCEPTION 'Invalid assignment answer' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.assignments assignment
    JOIN public.class_members member ON member.class_id = assignment.class_id
    JOIN public.assignment_questions assignment_question
      ON assignment_question.assignment_id = assignment.id
    WHERE assignment.id = _assignment_id
      AND assignment_question.question_id = _question_id
      AND member.user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'Assignment question is not available to this learner' USING ERRCODE = '42501';
  END IF;

  SELECT points INTO question_points
  FROM public.questions
  WHERE id = _question_id AND review_status = 'published';
  IF question_points IS NULL THEN
    RAISE EXCEPTION 'Published question not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*)::integer INTO total_questions
  FROM public.assignment_questions
  WHERE assignment_id = _assignment_id;

  INSERT INTO public.assignment_submissions(assignment_id, student_id, score, total)
  VALUES (_assignment_id, _user_id, 0, total_questions)
  ON CONFLICT (assignment_id, student_id) DO NOTHING;

  SELECT * INTO submission_row
  FROM public.assignment_submissions
  WHERE assignment_id = _assignment_id AND student_id = _user_id
  FOR UPDATE;
  IF submission_row.completed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Assignment is already complete' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.assignment_answers answer
    WHERE answer.submission_id = submission_row.id AND answer.question_id = _question_id
  ) THEN
    RAISE EXCEPTION 'Question has already been answered' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.attempts(user_id, question_id, answer, correct, time_taken_seconds)
  VALUES (
    _user_id, _question_id, left(trim(_submitted_answer), 2000), _correct,
    CASE WHEN _time_taken_seconds IS NULL THEN NULL ELSE LEAST(GREATEST(_time_taken_seconds, 0), 86400) END
  ) RETURNING id INTO attempt_id;

  INSERT INTO public.assignment_answers(
    submission_id, question_id, attempt_id, submitted_answer, correct,
    points_earned, time_taken_seconds
  ) VALUES (
    submission_row.id, _question_id, attempt_id, left(trim(_submitted_answer), 2000), _correct,
    CASE WHEN _correct THEN question_points ELSE 0 END,
    CASE WHEN _time_taken_seconds IS NULL THEN NULL ELSE LEAST(GREATEST(_time_taken_seconds, 0), 86400) END
  );

  SELECT count(*)::integer, (count(*) FILTER (WHERE answer.correct))::integer
  INTO answered_count, correct_count
  FROM public.assignment_answers answer
  WHERE answer.submission_id = submission_row.id;
  completed_at_value := CASE WHEN answered_count >= total_questions THEN now() ELSE NULL END;

  UPDATE public.assignment_submissions
  SET score = correct_count,
      total = total_questions,
      completed_at = coalesce(completed_at, completed_at_value)
  WHERE id = submission_row.id;

  RETURN jsonb_build_object(
    'answered_count', answered_count,
    'score', correct_count,
    'total', total_questions,
    'completed_at', completed_at_value
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_assignment_results()
RETURNS TABLE (
  assignment_id uuid,
  class_id uuid,
  student_id uuid,
  student_name text,
  answered_count integer,
  score integer,
  total integer,
  started_at timestamptz,
  completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    assignment.id,
    assignment.class_id,
    member.user_id,
    coalesce(nullif(trim(profile.display_name), ''), 'Learner'),
    coalesce(answer_totals.answered_count, 0)::integer,
    coalesce(submission.score, 0)::integer,
    coalesce(submission.total, assignment.question_count)::integer,
    submission.started_at,
    submission.completed_at
  FROM public.assignments assignment
  JOIN public.class_members member ON member.class_id = assignment.class_id
  LEFT JOIN public.profiles profile ON profile.user_id = member.user_id
  LEFT JOIN public.assignment_submissions submission
    ON submission.assignment_id = assignment.id AND submission.student_id = member.user_id
  LEFT JOIN LATERAL (
    SELECT count(*)::integer AS answered_count
    FROM public.assignment_answers answer
    WHERE answer.submission_id = submission.id
  ) answer_totals ON true
  WHERE assignment.teacher_id = auth.uid()
    AND public.has_role(auth.uid(), 'teacher');
$$;

CREATE TABLE IF NOT EXISTS public.answer_request_windows (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.answer_request_windows ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.answer_request_windows FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.answer_request_windows TO service_role;

CREATE OR REPLACE FUNCTION public.consume_answer_rate_limit(
  _user_id uuid,
  _max_requests integer DEFAULT 120,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  state public.answer_request_windows%ROWTYPE;
BEGIN
  IF _user_id IS NULL OR _max_requests NOT BETWEEN 1 AND 300
     OR _window_seconds NOT BETWEEN 10 AND 3600 THEN
    RETURN false;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text || ':answer'));
  SELECT * INTO state FROM public.answer_request_windows
  WHERE user_id = _user_id FOR UPDATE;

  IF NOT FOUND OR state.window_started_at <= now() - make_interval(secs => _window_seconds) THEN
    INSERT INTO public.answer_request_windows(user_id, window_started_at, request_count, updated_at)
    VALUES (_user_id, now(), 1, now())
    ON CONFLICT (user_id) DO UPDATE
      SET window_started_at = now(), request_count = 1, updated_at = now();
    RETURN true;
  END IF;
  IF state.request_count >= _max_requests THEN RETURN false; END IF;

  UPDATE public.answer_request_windows
  SET request_count = request_count + 1, updated_at = now()
  WHERE user_id = _user_id;
  RETURN true;
END;
$$;

REVOKE INSERT, UPDATE ON public.assignments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assignment_submissions FROM authenticated;

REVOKE ALL ON FUNCTION public.create_quiz_assignment(uuid, text, text, text[], integer, integer, integer, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_assignment_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_assignment_answer(uuid, uuid, uuid, text, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_teacher_assignment_results() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_answer_rate_limit(uuid, integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_quiz_assignment(uuid, text, text, text[], integer, integer, integer, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_assignment_session(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_assignment_answer(uuid, uuid, uuid, text, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_assignment_results() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_answer_rate_limit(uuid, integer, integer) TO service_role;
