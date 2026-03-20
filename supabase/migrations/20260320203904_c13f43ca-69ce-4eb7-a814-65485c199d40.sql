UPDATE questions
SET options = (options #>> '{}')::jsonb
WHERE jsonb_typeof(options) = 'string'
  AND options IS NOT NULL;