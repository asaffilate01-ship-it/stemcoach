-- Institutional onboarding is atomic and the institution owner is authorised server-side.
-- Supabase PostgreSQL migration; deploy after 20260831133345.
CREATE OR REPLACE FUNCTION public.is_institution_admin(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.tenant_id = _tenant_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
      AND m.status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.is_institution_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_admin(uuid) TO authenticated;

-- The previous FOR ALL policy queried its own table and granted teachers
-- administrative write access. Keep roster visibility strictly admin-only.
DROP POLICY IF EXISTS "Tenant admins can manage members" ON public.tenant_members;
DROP POLICY IF EXISTS "Institution admins may view member roster" ON public.tenant_members;
CREATE POLICY "Institution admins may view member roster"
ON public.tenant_members FOR SELECT TO authenticated
USING (public.is_institution_admin(tenant_id));

-- A client may request access as a student, but must never supply an elevated role
-- or self-approve a pending membership.
DROP POLICY IF EXISTS "Users can request to join" ON public.tenant_members;
CREATE POLICY "Users can request to join"
ON public.tenant_members FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'student'
  AND status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
);

-- Browser clients cannot edit paid plan limits, institution configuration or
-- member approval fields. The narrow SECURITY DEFINER RPCs below own those writes.
REVOKE INSERT, UPDATE, DELETE ON public.tenants FROM PUBLIC, anon, authenticated;
REVOKE UPDATE, DELETE ON public.tenant_members FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.register_institution(_name text, _slug text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _new_tenant_id uuid;
  _clean_name text := btrim(coalesce(_name, ''));
  _clean_slug text := lower(btrim(coalesce(_slug, '')));
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to register an institution' USING ERRCODE = '28000';
  END IF;
  IF char_length(_clean_name) NOT BETWEEN 3 AND 100 THEN
    RAISE EXCEPTION 'Institution name must contain 3 to 100 characters' USING ERRCODE = '22023';
  END IF;
  IF char_length(_clean_slug) NOT BETWEEN 3 AND 40
     OR _clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Institution identifier must be 3 to 40 lowercase letters, digits or hyphens' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.tenants (name, slug)
  VALUES (_clean_name, _clean_slug)
  RETURNING id INTO _new_tenant_id;

  INSERT INTO public.tenant_members
    (tenant_id, user_id, role, status, approved_by, approved_at)
  VALUES
    (_new_tenant_id, _user_id, 'admin', 'approved', _user_id, now());

  RETURN _new_tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_institution(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_institution(text, text) TO authenticated;

-- Serialise approvals for a tenant so two concurrent approvals cannot
-- exceed the student capacity. Only a verified institution admin may approve.
CREATE OR REPLACE FUNCTION public.review_institution_member(
  _tenant_id uuid, _member_id uuid, _approve boolean
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _member public.tenant_members%ROWTYPE;
  _capacity integer;
  _active_students integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator access required' USING ERRCODE = '42501';
  END IF;
  IF _approve IS NULL THEN
    RAISE EXCEPTION 'Approval decision required' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(t.max_students, 50) INTO _capacity
  FROM public.tenants t WHERE t.id = _tenant_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Institution not found' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _member
  FROM public.tenant_members m
  WHERE m.id = _member_id AND m.tenant_id = _tenant_id
  FOR UPDATE;
  IF NOT FOUND OR _member.status <> 'pending' OR _member.role <> 'student' THEN
    RAISE EXCEPTION 'Pending student membership not found' USING ERRCODE = '22023';
  END IF;

  IF _approve THEN
    SELECT count(*) INTO _active_students
    FROM public.tenant_members m
    WHERE m.tenant_id = _tenant_id
      AND m.role = 'student' AND m.status = 'approved';
    IF _active_students >= _capacity THEN
      RAISE EXCEPTION 'Institution student capacity reached' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.tenant_members
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         approved_by = CASE WHEN _approve THEN auth.uid() ELSE NULL END,
         approved_at = CASE WHEN _approve THEN now() ELSE NULL END
   WHERE id = _member_id AND tenant_id = _tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_institution_member(uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_institution_member(uuid, uuid, boolean) TO authenticated;

-- Branding cannot change the price plan, student capacity or custom domain.
CREATE OR REPLACE FUNCTION public.update_institution_branding(
  _tenant_id uuid, _name text, _primary_color text, _secondary_color text,
  _logo_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _clean_name text := btrim(coalesce(_name, ''));
  _clean_logo text := nullif(btrim(coalesce(_logo_url, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator access required' USING ERRCODE = '42501';
  END IF;
  IF char_length(_clean_name) NOT BETWEEN 3 AND 100
     OR coalesce(_primary_color, '') !~ '^#[0-9a-fA-F]{6}$'
     OR coalesce(_secondary_color, '') !~ '^#[0-9a-fA-F]{6}$' THEN
    RAISE EXCEPTION 'Please supply a valid name and six-digit colours' USING ERRCODE = '22023';
  END IF;
  IF _clean_logo IS NOT NULL
     AND (char_length(_clean_logo) > 2048 OR _clean_logo !~* '^https://[^[:space:]]+$') THEN
    RAISE EXCEPTION 'Institution logo must use a valid HTTPS URL' USING ERRCODE = '22023';
  END IF;

  UPDATE public.tenants
     SET name = _clean_name,
         logo_url = _clean_logo,
         primary_color = _primary_color,
         secondary_color = _secondary_color,
         updated_at = now()
   WHERE id = _tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_institution_branding(uuid, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_institution_branding(uuid, text, text, text, text) TO authenticated;
