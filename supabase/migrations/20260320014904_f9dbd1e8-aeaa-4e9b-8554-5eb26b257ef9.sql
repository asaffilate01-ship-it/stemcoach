
-- Allow anyone authenticated to look up tenants by slug (for join flow)
CREATE POLICY "Anyone can lookup tenants by slug"
ON public.tenants
FOR SELECT
TO authenticated
USING (true);
