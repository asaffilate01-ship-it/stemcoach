-- A least-privilege role for the academic content team.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reviewer';
