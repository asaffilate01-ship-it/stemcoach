ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_language text;

ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_preferred_language_check;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_preferred_language_check
  CHECK (preferred_language IS NULL OR preferred_language IN ('en', 'fr', 'de'));

COMMENT ON COLUMN public.user_preferences.preferred_language IS
  'The learner interface language. Null keeps browser/local device preference until explicitly selected.';
