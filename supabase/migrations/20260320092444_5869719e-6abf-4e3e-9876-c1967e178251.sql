CREATE OR REPLACE FUNCTION public.get_mock_exam_questions(
  _subject text,
  _curriculum text,
  _count integer,
  _board text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  question_text text,
  options jsonb,
  correct_answer text,
  topic text,
  subject text,
  difficulty integer,
  points integer,
  explanation text,
  worked_solution text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id, q.question_text, q.options, q.correct_answer,
    q.topic, q.subject, q.difficulty, q.points,
    q.explanation, q.worked_solution
  FROM questions q
  WHERE q.subject = _subject
    AND q.curriculum = _curriculum
    AND q.question_type = 'mcq'
    AND (_board IS NULL OR _board = ANY(q.boards))
  ORDER BY random()
  LIMIT _count;
END;
$$;