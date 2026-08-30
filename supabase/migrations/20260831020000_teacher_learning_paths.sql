-- Teacher-assigned, multi-tutorial learning paths. Completion is derived from
-- user_tutorial_progress, so browser clients cannot self-report teacher-facing
-- results.

CREATE TABLE IF NOT EXISTS public.tutorial_catalog (
  id text PRIMARY KEY,
  subject text NOT NULL,
  title text NOT NULL,
  level text NOT NULL CHECK (level IN ('Foundation', 'Intermediate', 'Advanced')),
  minutes integer NOT NULL CHECK (minutes BETWEEN 1 AND 180),
  CONSTRAINT tutorial_catalog_id_check CHECK (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  CONSTRAINT tutorial_catalog_subject_check CHECK (subject ~ '^[a-z0-9][a-z0-9-]{0,49}$'),
  CONSTRAINT tutorial_catalog_title_check CHECK (length(title) BETWEEN 3 AND 160)
);

ALTER TABLE public.tutorial_catalog ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.tutorial_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.tutorial_catalog TO anon, authenticated;
GRANT ALL ON public.tutorial_catalog TO service_role;

DROP POLICY IF EXISTS "Anyone reads the tutorial catalog" ON public.tutorial_catalog;
CREATE POLICY "Anyone reads the tutorial catalog"
  ON public.tutorial_catalog FOR SELECT TO anon, authenticated
  USING (true);

INSERT INTO public.tutorial_catalog(id, subject, title, level, minutes) VALUES
  ('quadratic-equations', 'mathematics', 'Solving Quadratic Equations', 'Intermediate', 12),
  ('gradient-and-rate', 'mathematics', 'Gradient as a Rate of Change', 'Foundation', 9),
  ('newtons-laws', 'physics', 'Newton''s Laws and Free-Body Diagrams', 'Intermediate', 14),
  ('electrical-circuits', 'physics', 'Series and Parallel Circuits', 'Foundation', 12),
  ('moles-stoichiometry', 'chemistry', 'Moles and Stoichiometry', 'Intermediate', 15),
  ('bonding-properties', 'chemistry', 'Bonding, Structure, and Properties', 'Foundation', 11),
  ('cell-division', 'biology', 'Mitosis, Meiosis, and the Cell Cycle', 'Intermediate', 14),
  ('enzyme-rates', 'biology', 'Enzymes and Rate Experiments', 'Foundation', 10),
  ('algorithms-complexity', 'computer-science', 'Algorithms and Big-O Thinking', 'Advanced', 15),
  ('boolean-logic', 'computer-science', 'Boolean Logic and Truth Tables', 'Foundation', 9),
  ('simultaneous-equations', 'mathematics', 'Simultaneous Equations by Elimination', 'Intermediate', 13),
  ('probability-trees', 'mathematics', 'Probability Trees and Conditional Events', 'Advanced', 16),
  ('momentum-collisions', 'physics', 'Momentum and Collisions', 'Advanced', 16),
  ('radioactivity-half-life', 'physics', 'Radioactivity and Half-Life', 'Intermediate', 13),
  ('rates-of-reaction', 'chemistry', 'Rates of Reaction and Collision Theory', 'Intermediate', 14),
  ('equilibrium-le-chatelier', 'chemistry', 'Equilibrium and Le Chatelier''s Principle', 'Advanced', 16),
  ('photosynthesis-limiting-factors', 'biology', 'Photosynthesis and Limiting Factors', 'Intermediate', 14),
  ('inheritance-punnett', 'biology', 'Inheritance and Punnett Squares', 'Intermediate', 15),
  ('binary-data', 'computer-science', 'Binary, Hexadecimal, and Data Representation', 'Intermediate', 14),
  ('network-security', 'computer-science', 'Network Threats and Defences', 'Advanced', 16),
  ('price-elasticity', 'economics', 'Price Elasticity of Demand', 'Intermediate', 14),
  ('analysing-quotations', 'english-literature', 'Analysing a Quotation', 'Intermediate', 13),
  ('reliability-validity', 'psychology', 'Reliability and Validity', 'Intermediate', 14),
  ('river-processes', 'geography', 'River Erosion and Transport', 'Foundation', 12),
  ('break-even', 'business-studies', 'Break-Even Analysis', 'Intermediate', 13),
  ('ielts-paragraph-cohesion', 'ielts', 'Building a Cohesive Academic Paragraph', 'Intermediate', 13),
  ('celta-concept-checking', 'celta', 'Concept-Checking Questions', 'Intermediate', 14),
  ('french-perfect-tense', 'french', 'Le passé composé avec avoir', 'Foundation', 13),
  ('german-accusative', 'german', 'Nominative and Accusative Cases', 'Foundation', 14)
ON CONFLICT (id) DO UPDATE SET
  subject = EXCLUDED.subject,
  title = EXCLUDED.title,
  level = EXCLUDED.level,
  minutes = EXCLUDED.minutes;

CREATE TABLE IF NOT EXISTS public.class_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.class_learning_paths(id) ON DELETE CASCADE,
  tutorial_id text NOT NULL REFERENCES public.tutorial_catalog(id) ON DELETE RESTRICT,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 12),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, tutorial_id),
  UNIQUE (path_id, position)
);

CREATE INDEX IF NOT EXISTS class_learning_paths_class_due_idx
  ON public.class_learning_paths(class_id, due_date, created_at DESC);
CREATE INDEX IF NOT EXISTS class_learning_paths_teacher_idx
  ON public.class_learning_paths(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS class_learning_path_items_path_position_idx
  ON public.class_learning_path_items(path_id, position);

ALTER TABLE public.class_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_learning_path_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.class_learning_paths FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.class_learning_path_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.class_learning_paths TO authenticated;
GRANT SELECT ON public.class_learning_path_items TO authenticated;
GRANT ALL ON public.class_learning_paths, public.class_learning_path_items TO service_role;

DROP POLICY IF EXISTS "Class participants read learning paths" ON public.class_learning_paths;
CREATE POLICY "Class participants read learning paths"
  ON public.class_learning_paths FOR SELECT TO authenticated
  USING (public.is_class_participant(class_id));

DROP POLICY IF EXISTS "Teachers delete own learning paths" ON public.class_learning_paths;
CREATE POLICY "Teachers delete own learning paths"
  ON public.class_learning_paths FOR DELETE TO authenticated
  USING (teacher_id = auth.uid() AND public.is_class_teacher(class_id));

DROP POLICY IF EXISTS "Class participants read learning path items" ON public.class_learning_path_items;
CREATE POLICY "Class participants read learning path items"
  ON public.class_learning_path_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.class_learning_paths path
      WHERE path.id = path_id AND public.is_class_participant(path.class_id)
    )
  );

CREATE OR REPLACE FUNCTION public.create_class_learning_path(
  _class_id uuid,
  _title text,
  _description text DEFAULT NULL,
  _due_date timestamptz DEFAULT NULL,
  _tutorial_ids text[] DEFAULT ARRAY[]::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  clean_title text := trim(coalesce(_title, ''));
  clean_description text := nullif(trim(coalesce(_description, '')), '');
  clean_ids text[];
  class_subject text;
  created_path_id uuid;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT public.has_role(actor, 'teacher') THEN
    RAISE EXCEPTION 'Teacher role required' USING ERRCODE = '42501';
  END IF;

  SELECT c.subject INTO class_subject
  FROM public.classes c
  WHERE c.id = _class_id AND c.teacher_id = actor;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found or not owned by teacher' USING ERRCODE = '42501';
  END IF;

  IF length(clean_title) NOT BETWEEN 1 AND 120
     OR length(coalesce(clean_description, '')) > 1000 THEN
    RAISE EXCEPTION 'Invalid learning path details' USING ERRCODE = '22023';
  END IF;
  IF _due_date IS NOT NULL AND _due_date > now() + interval '2 years' THEN
    RAISE EXCEPTION 'Due date is too far in the future' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(array_agg(item.id ORDER BY item.ordinality), ARRAY[]::text[])
  INTO clean_ids
  FROM (
    SELECT DISTINCT ON (lower(trim(supplied.id)))
      lower(trim(supplied.id)) AS id,
      supplied.ordinality
    FROM unnest(coalesce(_tutorial_ids, ARRAY[]::text[])) WITH ORDINALITY AS supplied(id, ordinality)
    WHERE trim(coalesce(supplied.id, '')) <> ''
    ORDER BY lower(trim(supplied.id)), supplied.ordinality
  ) item;

  IF cardinality(clean_ids) NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Choose between 1 and 12 unique tutorials' USING ERRCODE = '22023';
  END IF;
  IF (
    SELECT count(*) FROM public.tutorial_catalog tutorial
    WHERE tutorial.id = ANY(clean_ids) AND tutorial.subject = class_subject
  ) <> cardinality(clean_ids) THEN
    RAISE EXCEPTION 'Tutorials must exist and match the class subject' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.class_learning_paths(class_id, teacher_id, title, description, due_date)
  VALUES (_class_id, actor, clean_title, clean_description, _due_date)
  RETURNING id INTO created_path_id;

  INSERT INTO public.class_learning_path_items(path_id, tutorial_id, position)
  SELECT created_path_id, supplied.id, supplied.ordinality::smallint
  FROM unnest(clean_ids) WITH ORDINALITY AS supplied(id, ordinality);

  RETURN created_path_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_learning_path_progress()
RETURNS TABLE (
  path_id uuid,
  class_id uuid,
  student_id uuid,
  student_name text,
  tutorial_count integer,
  completed_count integer,
  last_activity_at timestamptz,
  path_completed boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    path.id AS path_id,
    path.class_id,
    member.user_id AS student_id,
    coalesce(nullif(trim(profile.display_name), ''), 'Learner') AS student_name,
    count(item.id)::integer AS tutorial_count,
    count(progress.tutorial_id) FILTER (WHERE progress.completed_at IS NOT NULL)::integer AS completed_count,
    max(progress.last_opened_at) AS last_activity_at,
    count(item.id) > 0
      AND count(progress.tutorial_id) FILTER (WHERE progress.completed_at IS NOT NULL) = count(item.id)
      AS path_completed
  FROM public.class_learning_paths path
  JOIN public.class_members member ON member.class_id = path.class_id
  JOIN public.class_learning_path_items item ON item.path_id = path.id
  LEFT JOIN public.user_tutorial_progress progress
    ON progress.user_id = member.user_id AND progress.tutorial_id = item.tutorial_id
  LEFT JOIN public.profiles profile ON profile.user_id = member.user_id
  WHERE path.teacher_id = auth.uid()
  GROUP BY path.id, path.class_id, member.user_id, profile.display_name;
$$;

REVOKE ALL ON FUNCTION public.create_class_learning_path(uuid, text, text, timestamptz, text[])
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_teacher_learning_path_progress()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_class_learning_path(uuid, text, text, timestamptz, text[])
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_learning_path_progress()
  TO authenticated, service_role;

-- Close legacy assignment write gaps while retaining the existing quiz UI.
-- A teacher must own the target class; a learner must belong to the assigned class.
DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;
CREATE POLICY "Teachers manage own classes"
  ON public.classes FOR ALL TO authenticated
  USING (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher'))
  WITH CHECK (teacher_id = auth.uid() AND public.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Teachers can manage own assignments" ON public.assignments;
CREATE POLICY "Teachers manage assignments in own classes"
  ON public.assignments FOR ALL TO authenticated
  USING (
    teacher_id = auth.uid()
    AND public.has_role(auth.uid(), 'teacher')
    AND public.is_class_teacher(class_id)
  )
  WITH CHECK (
    teacher_id = auth.uid()
    AND public.has_role(auth.uid(), 'teacher')
    AND public.is_class_teacher(class_id)
  );

DROP POLICY IF EXISTS "Students can manage own submissions" ON public.assignment_submissions;
CREATE POLICY "Students manage submissions for their class assignments"
  ON public.assignment_submissions FOR ALL TO authenticated
  USING (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assignments assignment
      WHERE assignment.id = assignment_id
        AND public.is_class_participant(assignment.class_id)
    )
  )
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.assignments assignment
      WHERE assignment.id = assignment_id
        AND public.is_class_participant(assignment.class_id)
    )
  );
