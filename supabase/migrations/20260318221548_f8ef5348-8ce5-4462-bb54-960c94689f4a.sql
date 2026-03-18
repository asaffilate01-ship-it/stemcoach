
-- Enforce study group member cap with a validation trigger
CREATE OR REPLACE FUNCTION public.check_study_group_member_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  SELECT count(*) INTO current_count
  FROM study_group_members
  WHERE group_id = NEW.group_id;

  SELECT max_members INTO max_allowed
  FROM study_groups
  WHERE id = NEW.group_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Study group is full (max % members)', max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_study_group_member_limit
  BEFORE INSERT ON public.study_group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_study_group_member_limit();
