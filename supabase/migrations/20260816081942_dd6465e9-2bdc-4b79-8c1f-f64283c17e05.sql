-- Controlled display-name lookup (name + avatar only)
CREATE OR REPLACE FUNCTION public.get_display_names(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = ANY(COALESCE(_user_ids, '{}'::uuid[]))
  LIMIT 500
$$;

REVOKE ALL ON FUNCTION public.get_display_names(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_display_names(uuid[]) TO authenticated, service_role;

-- Restrict direct profile reads to the owner
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);