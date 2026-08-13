DROP POLICY IF EXISTS "Anyone can lookup tenants by slug" ON public.tenants;

CREATE OR REPLACE FUNCTION public.lookup_tenant_by_slug(_slug text)
RETURNS TABLE(id uuid, name text, logo_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.name, t.logo_url
  FROM public.tenants t
  WHERE auth.uid() IS NOT NULL
    AND lower(t.slug) = lower(_slug)
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_tenant_by_slug(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_tenant_by_slug(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can read cache" ON public.coaching_cache;
REVOKE SELECT ON public.coaching_cache FROM authenticated, anon;
GRANT ALL ON public.coaching_cache TO service_role;