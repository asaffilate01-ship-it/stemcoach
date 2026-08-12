
DROP FUNCTION IF EXISTS public.get_mock_exam_questions(text, text, integer, text);

CREATE FUNCTION public.get_mock_exam_questions(_subject text, _curriculum text, _count integer, _board text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, question_text text, options jsonb, topic text, subject text, difficulty integer, points integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.topic, q.subject, q.difficulty, q.points
  FROM questions q
  WHERE q.subject = _subject
    AND q.curriculum = _curriculum
    AND q.question_type = 'mcq'
    AND (_board IS NULL OR _board = ANY(q.boards))
  ORDER BY random()
  LIMIT LEAST(GREATEST(COALESCE(_count, 10), 1), 100);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_mock_exam_questions(text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mock_exam_questions(text, text, integer, text) TO authenticated, service_role;
