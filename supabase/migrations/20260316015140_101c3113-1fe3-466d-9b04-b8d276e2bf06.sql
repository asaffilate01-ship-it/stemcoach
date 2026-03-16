
-- Fix the classes RLS policy bug: class_members.id should be classes.id
DROP POLICY IF EXISTS "Students can view joined classes" ON public.classes;
CREATE POLICY "Students can view joined classes"
  ON public.classes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM class_members
    WHERE class_members.class_id = classes.id AND class_members.user_id = auth.uid()
  ));
