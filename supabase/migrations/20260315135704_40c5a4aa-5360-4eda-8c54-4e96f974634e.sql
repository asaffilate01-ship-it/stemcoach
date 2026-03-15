
-- ═══════════════════════════════════════════════════════
-- MULTI-TENANT: Tenants (schools/tuition centres)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#1e40af',
  custom_domain text,
  plan text NOT NULL DEFAULT 'free',
  max_students integer DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tenant membership with approval workflow
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student',
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- PARENT PORTAL: Parent-child links
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  link_code text NOT NULL DEFAULT SUBSTRING(md5(random()::text) FROM 1 FOR 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- ═══════════════════════════════════════════════════════
-- TEACHER ASSIGNMENTS
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  topics text[] NOT NULL DEFAULT '{}',
  curriculum text NOT NULL,
  question_count integer NOT NULL DEFAULT 10,
  difficulty_min integer NOT NULL DEFAULT 1,
  difficulty_max integer NOT NULL DEFAULT 5,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  score integer,
  total integer,
  completed_at timestamptz,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- ═══════════════════════════════════════════════════════
-- SINGLE SESSION: Active sessions tracking
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  device_info text,
  ip_address text,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════
-- Add 'parent' to app_role enum
-- ═══════════════════════════════════════════════════════
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

-- Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their tenant" ON public.tenants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_members.tenant_id = tenants.id AND tenant_members.user_id = auth.uid()));
CREATE POLICY "Admins can manage tenants" ON public.tenants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Tenant members
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own membership" ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Tenant admins can manage members" ON public.tenant_members FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
    AND tm.user_id = auth.uid()
    AND tm.role IN ('admin', 'teacher')
    AND tm.status = 'approved'
  ));
CREATE POLICY "Users can request to join" ON public.tenant_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Parent links
ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents can view own links" ON public.parent_links FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "Children can view links to them" ON public.parent_links FOR SELECT TO authenticated
  USING (child_id = auth.uid());
CREATE POLICY "Parents can create links" ON public.parent_links FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Children can approve links" ON public.parent_links FOR UPDATE TO authenticated
  USING (child_id = auth.uid());

-- Assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own assignments" ON public.assignments FOR ALL TO authenticated
  USING (teacher_id = auth.uid());
CREATE POLICY "Students can view class assignments" ON public.assignments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_members cm
    WHERE cm.class_id = assignments.class_id AND cm.user_id = auth.uid()
  ));

-- Assignment submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own submissions" ON public.assignment_submissions FOR ALL TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "Teachers can view class submissions" ON public.assignment_submissions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.id = assignment_submissions.assignment_id AND a.teacher_id = auth.uid()
  ));

-- Active sessions
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON public.active_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid());
