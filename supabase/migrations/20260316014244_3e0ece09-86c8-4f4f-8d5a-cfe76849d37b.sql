
-- Restore triggers that were lost
-- 1. Profile creation on new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Default role assignment on new user
CREATE OR REPLACE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 3. Parent notification on certificate creation
CREATE OR REPLACE TRIGGER on_certificate_created
  AFTER INSERT ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.notify_parent_on_exam();

-- 4. Fix handle_new_user to also use requested_role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'requested_role';
  IF requested_role IN ('teacher', 'parent') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested_role::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  END IF;
  RETURN NEW;
END;
$function$;

-- 5. Add edge function configs for delete-account and export-data (handled in config.toml)
