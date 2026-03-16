-- Restore certificate trigger (public schema)
DROP TRIGGER IF EXISTS on_certificate_created ON public.certificates;
CREATE TRIGGER on_certificate_created
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_parent_on_exam();

-- Allow broader notification insert for trigger function
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow users to delete own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());