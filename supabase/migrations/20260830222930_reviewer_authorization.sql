-- Use the reviewer enum value only after the enum migration has committed.
CREATE OR REPLACE FUNCTION public.can_review_questions(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'reviewer'::public.app_role)
$$;

REVOKE ALL ON FUNCTION public.can_review_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_review_questions(uuid) TO authenticated, service_role;
