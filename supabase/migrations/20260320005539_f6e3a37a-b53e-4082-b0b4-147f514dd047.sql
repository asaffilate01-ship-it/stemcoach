
-- Fix security definer view warning: set the view to use INVOKER security
ALTER VIEW public.questions_safe SET (security_invoker = on);

-- The view needs RLS-bypassing access to questions table.
-- Since we removed the public SELECT policy on questions, students can't read it directly.
-- But the view owned by postgres bypasses RLS, so students can read via the view.
-- With security_invoker=on, we need to grant the view a way to read.
-- Actually, security_invoker=on means the view runs as the calling user, which won't have SELECT on questions.
-- We need security_invoker=off (default) for this to work — the view owner (postgres) bypasses RLS.
-- So let's turn it back off and accept that the view is intentionally DEFINER-based.
ALTER VIEW public.questions_safe SET (security_invoker = off);
