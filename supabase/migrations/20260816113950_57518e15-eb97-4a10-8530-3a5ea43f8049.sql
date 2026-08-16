CREATE OR REPLACE FUNCTION public.get_subject_question_counts()
RETURNS TABLE(subject text, question_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.subject, count(*)::bigint
  FROM public.questions q
  GROUP BY q.subject
$$;

REVOKE ALL ON FUNCTION public.get_subject_question_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_subject_question_counts() TO anon, authenticated, service_role;