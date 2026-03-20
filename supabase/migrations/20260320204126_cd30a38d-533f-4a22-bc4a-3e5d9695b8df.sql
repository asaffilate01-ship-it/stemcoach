-- Delete the remaining 15 unfixable MCQs with mismatched answers
DELETE FROM questions
WHERE question_type = 'mcq'
  AND options IS NOT NULL
  AND jsonb_typeof(options) = 'array'
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(options) elem WHERE elem = correct_answer);