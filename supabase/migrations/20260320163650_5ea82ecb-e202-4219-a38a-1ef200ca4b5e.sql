
-- Create a SECURITY DEFINER function to check tenant admin status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = 'admin'
      AND status = 'approved'
  )
$$;

-- Create a SECURITY DEFINER function to check tenant teacher status
CREATE OR REPLACE FUNCTION public.is_tenant_teacher(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = 'teacher'
      AND status = 'approved'
  )
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "Tenant admins can manage members" ON public.tenant_members;
DROP POLICY IF EXISTS "Tenant teachers can view members" ON public.tenant_members;

-- Recreate without recursion using the SECURITY DEFINER functions
CREATE POLICY "Tenant admins can manage members"
ON public.tenant_members
FOR ALL
TO authenticated
USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant teachers can view members"
ON public.tenant_members
FOR SELECT
TO authenticated
USING (public.is_tenant_teacher(auth.uid(), tenant_id));
