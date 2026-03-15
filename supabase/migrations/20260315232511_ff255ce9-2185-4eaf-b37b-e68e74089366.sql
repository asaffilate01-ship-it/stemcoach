
-- Study goals table for daily targets and tracking
CREATE TABLE public.study_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  target_questions integer NOT NULL DEFAULT 10,
  completed_questions integer NOT NULL DEFAULT 0,
  target_minutes integer NOT NULL DEFAULT 30,
  completed_minutes integer NOT NULL DEFAULT 0,
  subjects text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals" ON public.study_goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_study_goals_updated_at
  BEFORE UPDATE ON public.study_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Parent alerts: function to notify parents on exam completion
CREATE OR REPLACE FUNCTION public.notify_parent_on_exam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_rec RECORD;
  child_name TEXT;
BEGIN
  -- Get child display name
  SELECT display_name INTO child_name FROM profiles WHERE user_id = NEW.user_id LIMIT 1;
  
  -- Notify all approved parents
  FOR parent_rec IN
    SELECT parent_id FROM parent_links
    WHERE child_id = NEW.user_id AND status = 'approved'
  LOOP
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (
      parent_rec.parent_id,
      'Exam Completed!',
      COALESCE(child_name, 'Your child') || ' completed a ' || COALESCE(NEW.subject, 'practice') || ' exam with ' || COALESCE(NEW.score_percent, 0) || '% score.',
      'exam_complete',
      jsonb_build_object('child_id', NEW.user_id, 'certificate_id', NEW.id, 'subject', NEW.subject, 'score', NEW.score_percent)
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_parent_on_exam
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_parent_on_exam();
