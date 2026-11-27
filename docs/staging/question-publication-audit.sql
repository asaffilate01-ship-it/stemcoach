-- Read-only aggregate publication audit. No question text, answers or learner data returned.
-- Field completeness is not proof of academic correctness or board alignment.
WITH evaluated AS (
  SELECT question_type,
    NULLIF(btrim(correct_answer), '') IS NOT NULL AS primary_present,
    COALESCE(cardinality(correct_answers), 0) > 0
      AND NOT EXISTS (
        SELECT 1 FROM unnest(correct_answers) AS a(answer)
        WHERE NULLIF(btrim(a.answer), '') IS NULL
      ) AS alternatives_present,
    NULLIF(btrim(model_answer), '') IS NOT NULL
      AND NULLIF(btrim(mark_scheme), '') IS NOT NULL
      AND COALESCE(max_marks, 0) > 0 AS rubric_present,
    academic_verified_at IS NOT NULL AND academic_verified_by IS NOT NULL AS verification_recorded,
    question_type IN ('mcq','code','data-interpretation','assertion-reason') AS mock_selector_type
  FROM public.questions
  WHERE review_status = 'published'
), classified AS (
  SELECT *,
    CASE
      WHEN question_type = 'essay' THEN rubric_present
      WHEN question_type = 'multi-select' THEN alternatives_present
      ELSE primary_present
    END AS required_fields_present
  FROM evaluated
)
SELECT question_type,
  count(*) AS published_count,
  count(*) FILTER (WHERE NOT primary_present) AS empty_primary_count,
  count(*) FILTER (WHERE NOT primary_present AND alternatives_present) AS empty_primary_with_alternatives,
  count(*) FILTER (WHERE NOT primary_present AND rubric_present) AS empty_primary_with_rubric,
  count(*) FILTER (WHERE NOT required_fields_present) AS incomplete_format_fields,
  count(*) FILTER (WHERE verification_recorded) AS verification_recorded_count,
  count(*) FILTER (WHERE mock_selector_type) AS mock_selector_type_count,
  count(*) FILTER (WHERE mock_selector_type AND NOT primary_present) AS mock_selector_missing_primary
FROM classified
GROUP BY question_type
ORDER BY question_type;
