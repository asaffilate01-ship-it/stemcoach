
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can insert tickets (even unauthenticated via anon key)
CREATE POLICY "Anyone can submit a support ticket"
  ON public.support_tickets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
  ON public.support_tickets
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
