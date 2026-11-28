-- Read-only structural audit. PostgreSQL 17+, UTF-8. No question text,
-- answer keys, learner identifiers or individual question IDs are returned.
-- Counts are mutually exclusive; structural eligibility is NOT academic approval.
WITH raw AS (
  SELECT question_type, correct_answer, academic_verified_at, academic_verified_by,
    CASE WHEN jsonb_typeof(options)='array' THEN options
      WHEN jsonb_typeof(options)='string' THEN
        CASE WHEN pg_input_is_valid(options #>> '{}','jsonb')
          THEN (options #>> '{}')::jsonb END
    END AS decoded
  FROM public.questions
  WHERE review_status='published'
    AND question_type IN ('mcq','code','data-interpretation','assertion-reason')
), safe AS (
  SELECT *, CASE WHEN jsonb_typeof(decoded)='array'
    THEN CASE WHEN jsonb_array_length(decoded) BETWEEN 2 AND 8 THEN decoded END END AS choices
  FROM raw
), checked AS (
  SELECT *, choices IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(coalesce(choices,'[]'::jsonb)) v
    WHERE jsonb_typeof(v)<>'string' OR length(btrim(v#>>'{}'))=0 OR length(v#>>'{}')>2000
  ) AS shape_ok FROM safe
), validated AS (
  SELECT *, shape_ok AND (
    SELECT count(DISTINCT lower(btrim(normalize(v#>>'{}', NFKC))))
    FROM jsonb_array_elements(coalesce(choices,'[]'::jsonb)) v
  )=jsonb_array_length(coalesce(choices,'[]'::jsonb)) AS unique_ok,
  shape_ok AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(coalesce(choices,'[]'::jsonb)) v
    WHERE lower(btrim(normalize(v#>>'{}',NFKC)))=lower(btrim(normalize(correct_answer,NFKC)))
  ) AS key_ok
  FROM checked
)
SELECT question_type,count(*) AS pool,
  count(*) FILTER (WHERE NOT shape_ok) AS invalid_shape,
  count(*) FILTER (WHERE shape_ok AND NOT unique_ok) AS duplicate_normalised_choices,
  count(*) FILTER (WHERE shape_ok AND unique_ok AND NOT key_ok) AS unmatched_key,
  count(*) FILTER (WHERE shape_ok AND unique_ok AND key_ok) AS structurally_eligible,
  count(*) FILTER (WHERE shape_ok AND unique_ok AND key_ok
    AND academic_verified_at IS NOT NULL AND academic_verified_by IS NOT NULL) AS verification_recorded
FROM validated GROUP BY question_type ORDER BY question_type;
