-- Cross-platform education institution and course review, NOT live SSO or access grants.
-- Staging prerequisite: STEMCoach October institution security and report migrations.
-- No pre-existing subscription, entitlement, quiz, content or academic grade is modified.
CREATE TABLE public.education_partner_bindings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  source_product text NOT NULL CHECK (source_product IN ('ilmvero','unipathways')),
  source_institution_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','disabled')),
  evidence_ref text,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_product, source_institution_id),
  CHECK (status <> 'verified' OR (
    verified_by IS NOT NULL AND verified_at IS NOT NULL
    AND length(btrim(coalesce(evidence_ref,''))) BETWEEN 8 AND 200
    AND (valid_until IS NULL OR valid_until > verified_at)
  ))
);
CREATE TABLE public.education_partner_course_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id uuid NOT NULL REFERENCES public.education_partner_bindings(id) ON DELETE CASCADE,
  source_course_ref text NOT NULL
    CHECK (length(source_course_ref) BETWEEN 1 AND 100 AND source_course_ref ~ '^[A-Za-z0-9_.:-]+$'),
  curriculum text NOT NULL CHECK (curriculum ~ '^[A-Za-z0-9_-]{2,80}$'),
  subject text NOT NULL CHECK (subject ~ '^[a-z0-9-]{1,64}$'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','disabled')),
  review_ref text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(binding_id, source_course_ref, curriculum, subject),
  UNIQUE(binding_id, id),
  CHECK (status <> 'reviewed' OR (
    reviewed_at IS NOT NULL AND length(btrim(coalesce(review_ref,''))) BETWEEN 8 AND 200
  ))
);
CREATE TABLE public.education_partner_learner_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id uuid NOT NULL REFERENCES public.education_partner_bindings(id) ON DELETE CASCADE,
  stemcoach_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_learner_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','revoked')),
  verified_at timestamptz,
  verified_until timestamptz,
  identity_evidence_ref text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(binding_id, stemcoach_user_id),
  UNIQUE(binding_id, source_learner_id),
  UNIQUE(binding_id, id),
  CHECK (status <> 'verified' OR (
    verified_at IS NOT NULL AND verified_until IS NOT NULL
    AND verified_until > verified_at
    AND length(btrim(coalesce(identity_evidence_ref,''))) BETWEEN 8 AND 200
    AND revoked_at IS NULL
  ))
);
-- These operator-reviewed proposals do not currently grant paid access or seat rights.
CREATE TABLE public.education_partner_course_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  binding_id uuid NOT NULL REFERENCES public.education_partner_bindings(id) ON DELETE CASCADE,
  learner_link_id uuid NOT NULL,
  course_map_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','disabled')),
  effective_from timestamptz NOT NULL,
  effective_until timestamptz NOT NULL,
  source_approval_ref text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (binding_id, learner_link_id)
    REFERENCES public.education_partner_learner_links(binding_id, id) ON DELETE CASCADE,
  FOREIGN KEY (binding_id, course_map_id)
    REFERENCES public.education_partner_course_maps(binding_id, id) ON DELETE CASCADE,
  UNIQUE (learner_link_id, course_map_id),
  CHECK (effective_until > effective_from),
  CHECK (status <> 'reviewed' OR (
    reviewed_at IS NOT NULL
    AND length(btrim(coalesce(source_approval_ref,''))) BETWEEN 8 AND 200
  ))
);
-- Locked down, only a service operator may register a verified partner/curriculum/learner.
DO $policy$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'education_partner_bindings','education_partner_course_maps',
    'education_partner_learner_links','education_partner_course_proposals'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role',t);
  END LOOP;
END;
$policy$;
-- Read-only preview: requires destination student approval plus every live source review.
-- Returns no personal/student/source UUID or learning answer. NOT a subscription gate.
CREATE OR REPLACE FUNCTION public.get_my_partner_course_preview()
RETURNS TABLE (
  source_product text,
  institution_name text,
  curriculum text,
  subject text,
  valid_until timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT binding.source_product, institution.name, course.curriculum,
         course.subject,
         least(proposal.effective_until, learner.verified_until,
           coalesce(binding.valid_until,proposal.effective_until)) AS valid_until
  FROM public.education_partner_course_proposals proposal
  JOIN public.education_partner_bindings binding ON binding.id = proposal.binding_id
  JOIN public.education_partner_course_maps course
    ON course.id = proposal.course_map_id AND course.binding_id = binding.id
  JOIN public.education_partner_learner_links learner
    ON learner.id = proposal.learner_link_id AND learner.binding_id = binding.id
  JOIN public.tenants institution ON institution.id = binding.tenant_id
  JOIN public.tenant_members membership
    ON membership.tenant_id = binding.tenant_id
      AND membership.user_id = learner.stemcoach_user_id
      AND membership.role = 'student' AND membership.status = 'approved'
  WHERE auth.uid() IS NOT NULL AND learner.stemcoach_user_id = auth.uid()
    AND binding.status = 'verified' AND course.status = 'reviewed'
    AND learner.status = 'verified' AND learner.revoked_at IS NULL
    AND proposal.status = 'reviewed'
    AND proposal.effective_from <= now() AND proposal.effective_until > now()
    AND learner.verified_until > now()
    AND (binding.valid_until IS NULL OR binding.valid_until > now())
  ORDER BY institution.name, course.subject LIMIT 100;
$$;
REVOKE ALL ON FUNCTION public.get_my_partner_course_preview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_partner_course_preview() TO authenticated;
