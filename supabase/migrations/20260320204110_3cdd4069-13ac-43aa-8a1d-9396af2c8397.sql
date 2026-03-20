-- Fix "k^n * det(A), where n is..." → match to "k^n * det(A)" (partial match)
-- Fix "Option C" → match to "Option C: ..." 
-- Fix "text (extra)" → match to "text (different)" where base text matches
-- Fix remaining letter answers where options contain letter values
-- Use best-effort matching: strip prefixes and find closest match

-- 1. Fix "Option X" style correct_answers
UPDATE questions q
SET correct_answer = matched.opt
FROM (
  SELECT q2.id, elem.opt
  FROM questions q2,
  LATERAL jsonb_array_elements_text(q2.options) AS elem(opt)
  WHERE q2.question_type = 'mcq'
    AND q2.options IS NOT NULL
    AND jsonb_typeof(q2.options) = 'array'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(q2.options) e WHERE e = q2.correct_answer)
    AND q2.correct_answer ~ '^Option [A-D]'
    AND elem.opt LIKE q2.correct_answer || '%'
) matched
WHERE q.id = matched.id;

-- 2. Fix where correct_answer is a substring of exactly one option
UPDATE questions q
SET correct_answer = matched.opt
FROM (
  SELECT q2.id, MIN(elem.opt) as opt
  FROM questions q2,
  LATERAL jsonb_array_elements_text(q2.options) AS elem(opt)
  WHERE q2.question_type = 'mcq'
    AND q2.options IS NOT NULL
    AND jsonb_typeof(q2.options) = 'array'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(q2.options) e WHERE e = q2.correct_answer)
    AND q2.correct_answer !~ '^[A-D]$'
    AND length(q2.correct_answer) > 5
    AND elem.opt LIKE '%' || left(q2.correct_answer, LEAST(length(q2.correct_answer), 40)) || '%'
  GROUP BY q2.id
  HAVING count(*) = 1
) matched
WHERE q.id = matched.id;

-- 3. Delete unfixable MCQs where correct_answer doesn't match any option
DELETE FROM questions
WHERE question_type = 'mcq'
  AND options IS NOT NULL
  AND jsonb_typeof(options) = 'array'
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(options) elem WHERE elem = correct_answer)
  AND correct_answer !~ '^[A-D]$';