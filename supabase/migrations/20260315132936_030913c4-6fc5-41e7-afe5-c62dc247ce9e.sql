
-- Class members table (created BEFORE classes policies that reference it)
CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Classes table for teachers
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  curriculum TEXT NOT NULL,
  join_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add FK constraint on class_members
ALTER TABLE public.class_members ADD CONSTRAINT fk_class_members_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own classes" ON public.classes FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view joined classes" ON public.classes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.class_members WHERE class_id = id AND user_id = auth.uid())
);

-- RLS for class_members
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage class members" ON public.class_members FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid())
);
CREATE POLICY "Students can view own membership" ON public.class_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Students can join classes" ON public.class_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
