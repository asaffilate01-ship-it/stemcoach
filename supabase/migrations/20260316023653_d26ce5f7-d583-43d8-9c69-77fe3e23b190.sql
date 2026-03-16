
-- Allow users to insert their own role during signup
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Recreate notify_parent_on_exam trigger on certificates
DROP TRIGGER IF EXISTS on_certificate_created ON public.certificates;
CREATE TRIGGER on_certificate_created
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_parent_on_exam();
