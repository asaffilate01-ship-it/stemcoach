-- Phase 5: institution admin may safely offboard teachers.
-- Guard against deleting a global teacher role still used by another institution.
-- Retains membership history, but revokes current institution access.
CREATE OR REPLACE FUNCTION public.offboard_institution_teacher(
  _tenant_id uuid, _teacher_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  changed_count integer;
BEGIN
  IF actor IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator required' USING ERRCODE = '42501';
  END IF;
  IF _teacher_user_id IS NULL OR actor = _teacher_user_id THEN
    RAISE EXCEPTION 'Invalid teacher selection' USING ERRCODE = '22023';
  END IF;

  -- Serialize operations that affect this user's role across institutions.
  PERFORM pg_advisory_xact_lock(hashtextextended(_teacher_user_id::text, 0));

  UPDATE public.tenant_members
     SET status = 'rejected', approved_by = NULL, approved_at = NULL
   WHERE tenant_id = _tenant_id
     AND user_id = _teacher_user_id
     AND role = 'teacher'
     AND status = 'approved';
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  IF changed_count <> 1 THEN
    RETURN false;
  END IF;

  -- Do not strip teaching access when another approved institution needs it.
  IF NOT EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.user_id = _teacher_user_id
      AND m.role = 'teacher'
      AND m.status = 'approved'
  ) THEN
    DELETE FROM public.user_roles
    WHERE user_id = _teacher_user_id AND role = 'teacher'::public.app_role;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.offboard_institution_teacher(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offboard_institution_teacher(uuid, uuid) TO authenticated;
