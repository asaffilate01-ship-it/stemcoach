-- STEMCoach: one-time, email-verified school teacher invitations.
-- Depends on 20261008190000_institution_onboarding_security.sql.
-- Invitations are manual-link delivery; no email sender or enterprise SSO is implied.

-- Client signup metadata is untrusted and cannot grant teaching privileges.
-- Preserve existing parent signups; all teacher candidates receive student access
-- until a verified institution administrator invites their confirmed email.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data->>'requested_role' = 'parent'
      THEN 'parent'::public.app_role ELSE 'student'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.institution_teacher_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT invite_email_normalized CHECK (invitee_email = lower(btrim(invitee_email))),
  CONSTRAINT invite_valid_expiry CHECK (expires_at > created_at AND expires_at <= created_at + interval '8 days')
);
CREATE INDEX IF NOT EXISTS institution_teacher_invites_tenant_created_idx
  ON public.institution_teacher_invites(tenant_id, created_at DESC);

ALTER TABLE public.institution_teacher_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.institution_teacher_invites FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_institution_teacher_invite(
  _tenant_id uuid, _email text
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  email_normalized text := lower(btrim(coalesce(_email, '')));
  random_token text;
  invitations_last_hour bigint;
BEGIN
  IF actor IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator required' USING ERRCODE = '42501';
  END IF;
  IF char_length(email_normalized) NOT BETWEEN 6 AND 254
     OR email_normalized !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' THEN
    RAISE EXCEPTION 'A valid teacher email is required' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO invitations_last_hour
  FROM public.institution_teacher_invites
  WHERE tenant_id = _tenant_id AND created_at >= now() - interval '1 hour';
  IF invitations_last_hour >= 20 THEN
    RAISE EXCEPTION 'Invitation limit reached for this institution' USING ERRCODE = '22023';
  END IF;

  -- A fresh invitation invalidates all older unaccepted links for that address.
  UPDATE public.institution_teacher_invites
     SET revoked_at = now()
   WHERE tenant_id = _tenant_id
     AND invitee_email = email_normalized
     AND accepted_at IS NULL AND revoked_at IS NULL;

  random_token := replace(gen_random_uuid()::text, '-', '')
               || replace(gen_random_uuid()::text, '-', '');
  INSERT INTO public.institution_teacher_invites(
    tenant_id, invitee_email, token_hash, created_by, expires_at
  ) VALUES (
    _tenant_id,
    email_normalized,
    encode(sha256(convert_to(random_token, 'UTF8')), 'hex'),
    actor,
    now() + interval '7 days'
  );

  -- The token is returned once to the admin to copy; only the hash is stored.
  RETURN random_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_institution_teacher_invite(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_institution_teacher_invite(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_institution_teacher_invites(_tenant_id uuid)
RETURNS TABLE(
  id uuid, invitee_email text, created_at timestamptz,
  expires_at timestamptz, accepted_at timestamptz, revoked_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT i.id, i.invitee_email, i.created_at, i.expires_at, i.accepted_at, i.revoked_at
    FROM public.institution_teacher_invites i
    WHERE i.tenant_id = _tenant_id
    ORDER BY i.created_at DESC
    LIMIT 100;
END;
$$;

REVOKE ALL ON FUNCTION public.list_institution_teacher_invites(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_institution_teacher_invites(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_institution_teacher_invite(
  _tenant_id uuid, _invitation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  affected integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.institution_teacher_invites
     SET revoked_at = now()
   WHERE id = _invitation_id AND tenant_id = _tenant_id
     AND accepted_at IS NULL AND revoked_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_institution_teacher_invite(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_institution_teacher_invite(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_institution_teacher_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  confirmed_email text;
  verified_at timestamptz;
  invitation public.institution_teacher_invites%ROWTYPE;
  changed integer;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Sign in to accept this invitation' USING ERRCODE = '28000';
  END IF;
  IF coalesce(_token, '') !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid invitation code' USING ERRCODE = '22023';
  END IF;

  SELECT lower(btrim(u.email)), u.email_confirmed_at
    INTO confirmed_email, verified_at
  FROM auth.users u WHERE u.id = actor;

  IF confirmed_email IS NULL OR verified_at IS NULL THEN
    RAISE EXCEPTION 'Verify your email address before accepting the invitation' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO invitation
  FROM public.institution_teacher_invites i
  WHERE i.token_hash = encode(sha256(convert_to(_token, 'UTF8')), 'hex')
  FOR UPDATE;

  IF NOT FOUND OR invitation.accepted_at IS NOT NULL
     OR invitation.revoked_at IS NOT NULL OR invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'This invitation has expired or is no longer available' USING ERRCODE = '22023';
  END IF;
  IF confirmed_email <> invitation.invitee_email THEN
    RAISE EXCEPTION 'Sign in with the invited, verified email address' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.tenant_members(
    tenant_id, user_id, role, status, approved_by, approved_at
  ) VALUES (
    invitation.tenant_id, actor, 'teacher', 'approved', invitation.created_by, now()
  )
  ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = 'teacher', status = 'approved',
        approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at
    WHERE public.tenant_members.role <> 'admin';
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN
    RAISE EXCEPTION 'An institution administrator cannot be reassigned by an invitation' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_roles(user_id, role)
  VALUES (actor, 'teacher'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.institution_teacher_invites
     SET accepted_by = actor, accepted_at = now()
   WHERE id = invitation.id;

  RETURN invitation.tenant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_institution_teacher_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_institution_teacher_invite(text) TO authenticated;
