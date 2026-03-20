-- Fix MCQs where correct_answer is a letter and options array has enough elements
UPDATE questions
SET correct_answer = CASE correct_answer
  WHEN 'A' THEN options->>0
  WHEN 'B' THEN options->>1
  WHEN 'C' THEN options->>2
  WHEN 'D' THEN options->>3
END
WHERE question_type = 'mcq'
  AND correct_answer ~ '^[A-D]$'
  AND options IS NOT NULL
  AND jsonb_typeof(options) = 'array'
  AND jsonb_array_length(options) >= 4
  AND CASE correct_answer
    WHEN 'A' THEN options->>0
    WHEN 'B' THEN options->>1
    WHEN 'C' THEN options->>2
    WHEN 'D' THEN options->>3
  END IS NOT NULL;