
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add admin policies for questions table (edit/delete)
CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow anyone to read questions (for practice)
CREATE POLICY "Anyone can read questions"
  ON public.questions FOR SELECT TO authenticated
  USING (true);

-- Parents can view child attempts
CREATE POLICY "Parents can view child attempts"
  ON public.attempts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.parent_links
      WHERE parent_links.parent_id = auth.uid()
        AND parent_links.child_id = attempts.user_id
        AND parent_links.status = 'approved'
    )
  );

-- Parents can view child stats
CREATE POLICY "Parents can view child stats"
  ON public.user_stats FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.parent_links
      WHERE parent_links.parent_id = auth.uid()
        AND parent_links.child_id = user_stats.user_id
        AND parent_links.status = 'approved'
    )
  );
