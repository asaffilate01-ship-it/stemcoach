-- Institution-linked classroom reporting.
-- Classes remain owned by their teacher. An institution association is explicit
-- and cannot be forged with a browser INSERT or by guessing a classroom UUID.
CREATE TABLE IF NOT EXISTS public.institution_class_links (
  class_id uuid PRIMARY KEY REFERENCES public.classes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  linked_by uuid NOT NULL REFERENCES auth.users(id),
  linked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS institution_class_links_tenant_idx
  ON public.institution_class_links(tenant_id, linked_at DESC);
ALTER TABLE public.institution_class_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.institution_class_links FROM PUBLIC, anon, authenticated;

-- Only the owning teacher, while approved as staff of this institution, can
-- associate a class. Linking to multiple institutions is not permitted.
CREATE OR REPLACE FUNCTION public.link_institution_class(_tenant_id uuid, _class_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := auth.uid();
  existing_tenant uuid;
BEGIN
  IF actor IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.tenant_id = _tenant_id AND m.user_id = actor
      AND m.role = 'teacher' AND m.status = 'approved'
  ) THEN
    RAISE EXCEPTION 'Approved institution teacher required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = _class_id AND c.teacher_id = actor
  ) THEN
    RAISE EXCEPTION 'Only the owning teacher may link a classroom' USING ERRCODE = '42501';
  END IF;

  SELECT l.tenant_id INTO existing_tenant
  FROM public.institution_class_links l WHERE l.class_id = _class_id;

  IF existing_tenant IS NOT NULL AND existing_tenant <> _tenant_id THEN
    RAISE EXCEPTION 'Classroom already belongs to another institution' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.institution_class_links(class_id, tenant_id, linked_by)
  VALUES (_class_id, _tenant_id, actor)
  ON CONFLICT (class_id) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.link_institution_class(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_institution_class(uuid, uuid) TO authenticated;

-- Teacher UI can identify which of its own classes have been linked.
CREATE OR REPLACE FUNCTION public.get_my_institution_class_links()
RETURNS TABLE(class_id uuid, tenant_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '28000';
  END IF;
  RETURN QUERY
    SELECT l.class_id, l.tenant_id
    FROM public.institution_class_links l
    JOIN public.classes c ON c.id = l.class_id
    JOIN public.tenant_members m
      ON m.tenant_id = l.tenant_id AND m.user_id = auth.uid()
         AND m.role = 'teacher' AND m.status = 'approved'
    WHERE c.teacher_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_institution_class_links() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_institution_class_links() TO authenticated;

-- Administrators receive only aggregated classwork for approved members of
-- their institution. Personal attempts, unlinked classes, and other tenants
-- are never included. Suppress average marks for fewer than three completions.
CREATE OR REPLACE FUNCTION public.get_institution_class_progress(_tenant_id uuid)
RETURNS TABLE(
  class_id uuid,
  class_name text,
  subject text,
  curriculum text,
  learner_enrolments bigint,
  assigned_quizzes bigint,
  completed_submissions bigint,
  average_score_percent numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_institution_admin(_tenant_id) THEN
    RAISE EXCEPTION 'Institution administrator required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT
      c.id,
      c.name,
      c.subject,
      c.curriculum,
      coalesce(learner_count.total, 0)::bigint,
      coalesce(assignment_count.total, 0)::bigint,
      coalesce(completions.total, 0)::bigint,
      CASE
        WHEN coalesce(completions.total, 0) >= 3
          THEN completions.average_percent
        ELSE NULL::numeric
      END
    FROM public.institution_class_links link
    JOIN public.classes c ON c.id = link.class_id
    JOIN public.tenant_members teacher_membership
      ON teacher_membership.tenant_id = link.tenant_id
         AND teacher_membership.user_id = c.teacher_id
         AND teacher_membership.role = 'teacher'
         AND teacher_membership.status = 'approved'
    LEFT JOIN LATERAL (
      SELECT count(DISTINCT cm.user_id)::bigint AS total
      FROM public.class_members cm
      JOIN public.tenant_members learner
        ON learner.user_id = cm.user_id
           AND learner.tenant_id = _tenant_id
           AND learner.status = 'approved'
           AND learner.role = 'student'
      WHERE cm.class_id = c.id
    ) learner_count ON true
    LEFT JOIN LATERAL (
      SELECT count(*)::bigint AS total
      FROM public.assignments a
      WHERE a.class_id = c.id
    ) assignment_count ON true
    LEFT JOIN LATERAL (
      SELECT
        count(*)::bigint AS total,
        round(avg(100.0 * s.score::numeric / nullif(s.total, 0)), 1) AS average_percent
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.class_members cm ON cm.class_id = a.class_id AND cm.user_id = s.student_id
      JOIN public.tenant_members learner
        ON learner.user_id = s.student_id
           AND learner.tenant_id = _tenant_id
           AND learner.status = 'approved'
           AND learner.role = 'student'
      WHERE a.class_id = c.id AND s.completed_at IS NOT NULL
    ) completions ON true
    WHERE link.tenant_id = _tenant_id
    ORDER BY c.created_at DESC
    LIMIT 200;
END;
$$;
REVOKE ALL ON FUNCTION public.get_institution_class_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_institution_class_progress(uuid) TO authenticated;
