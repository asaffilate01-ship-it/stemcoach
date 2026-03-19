-- Drop the overly permissive question SELECT policies
DROP POLICY IF EXISTS "Anyone can read questions" ON public.questions;
DROP POLICY IF EXISTS "Questions viewable by authenticated" ON public.questions;

-- Only users with active quota (purchased) can read questions
CREATE POLICY "Paid users can read questions"
ON public.questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_quotas
    WHERE user_quotas.user_id = auth.uid()
      AND user_quotas.total_questions > 0
      AND user_quotas.used_questions < user_quotas.total_questions
  )
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'teacher')
);

-- Server-side session validation function
CREATE OR REPLACE FUNCTION public.register_session(
  _user_id uuid,
  _session_token text,
  _device_info text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete any existing sessions for this user (enforce single session)
  DELETE FROM active_sessions WHERE user_id = _user_id;
  
  -- Insert new session
  INSERT INTO active_sessions (user_id, session_token, device_info, last_active)
  VALUES (_user_id, _session_token, _device_info, now());
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Server-side session check function
CREATE OR REPLACE FUNCTION public.validate_session(
  _user_id uuid,
  _session_token text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM active_sessions
    WHERE user_id = _user_id
      AND session_token = _session_token
  );
$$;