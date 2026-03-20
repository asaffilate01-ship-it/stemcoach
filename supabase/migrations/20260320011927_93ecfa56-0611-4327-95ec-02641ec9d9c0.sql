
-- Allow authenticated users to create tenants (for institution registration)
CREATE POLICY "Authenticated users can create tenants"
ON public.tenants FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow tenant admins to update their own tenant
DROP POLICY IF EXISTS "Admins can manage tenants" ON public.tenants;
CREATE POLICY "Tenant admins can manage own tenant"
ON public.tenants FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_members tm
    WHERE tm.tenant_id = tenants.id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
      AND tm.status = 'approved'
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
