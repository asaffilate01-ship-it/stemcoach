-- Launch content governance: only academically reviewed questions are student-visible.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'needs_review',
  ADD COLUMN IF NOT EXISTS content_origin text NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS specification_version text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS quality_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_review_status_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_review_status_check
  CHECK (review_status IN ('needs_review', 'published', 'rejected', 'archived'));

ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN ('mcq', 'multi-select', 'numerical', 'multi-step', 'essay', 'code', 'data-interpretation', 'assertion-reason'));

CREATE INDEX IF NOT EXISTS idx_questions_review_status ON public.questions(review_status);
CREATE INDEX IF NOT EXISTS idx_questions_curriculum_subject_status
  ON public.questions(curriculum, subject, review_status);

-- Existing generated/legacy content must be reviewed rather than silently presented as verified.
UPDATE public.questions
SET review_status = 'needs_review',
    content_origin = COALESCE(NULLIF(content_origin, ''), 'legacy')
WHERE reviewed_at IS NULL AND review_status <> 'archived';

CREATE OR REPLACE FUNCTION public.question_quality_flags(_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  q public.questions%ROWTYPE;
  flags jsonb := '[]'::jsonb;
  option_count integer := 0;
BEGIN
  SELECT * INTO q FROM public.questions WHERE id = _question_id;
  IF q.id IS NULL THEN RETURN jsonb_build_array('question_not_found'); END IF;

  IF length(trim(q.question_text)) < 12 THEN flags := flags || '"question_too_short"'::jsonb; END IF;
  IF length(trim(q.explanation)) < 20 THEN flags := flags || '"explanation_incomplete"'::jsonb; END IF;
  IF length(trim(q.worked_solution)) < 20 THEN flags := flags || '"worked_solution_incomplete"'::jsonb; END IF;
  IF coalesce(array_length(q.tuition_tips, 1), 0) < 1 THEN flags := flags || '"tuition_tips_missing"'::jsonb; END IF;
  IF length(trim(q.exam_tip)) < 8 THEN flags := flags || '"exam_tip_missing"'::jsonb; END IF;

  IF q.question_type IN ('mcq', 'code', 'data-interpretation', 'assertion-reason') THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' THEN
      flags := flags || '"options_missing"'::jsonb;
    ELSE
      option_count := jsonb_array_length(q.options);
      IF option_count < 3 OR option_count > 6 THEN flags := flags || '"invalid_option_count"'::jsonb; END IF;
      IF NOT (q.options @> jsonb_build_array(q.correct_answer)) THEN flags := flags || '"answer_not_in_options"'::jsonb; END IF;
    END IF;
  ELSIF q.question_type = 'multi-select' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 4 THEN
      flags := flags || '"options_missing"'::jsonb;
    END IF;
    IF coalesce(array_length(q.correct_answers, 1), 0) < 2 THEN flags := flags || '"multiple_answers_missing"'::jsonb; END IF;
  ELSIF q.question_type = 'numerical' THEN
    IF trim(q.correct_answer) !~ '[-+]?[0-9]' THEN flags := flags || '"numeric_answer_missing"'::jsonb; END IF;
  ELSE
    IF length(trim(coalesce(q.mark_scheme, ''))) < 20 THEN flags := flags || '"mark_scheme_missing"'::jsonb; END IF;
    IF length(trim(coalesce(q.model_answer, ''))) < 30 THEN flags := flags || '"model_answer_missing"'::jsonb; END IF;
  END IF;

  RETURN flags;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_question(_question_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  flags jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required' USING ERRCODE = '42501';
  END IF;
  flags := public.question_quality_flags(_question_id);
  UPDATE public.questions SET quality_flags = flags WHERE id = _question_id;
  IF jsonb_array_length(flags) > 0 THEN
    RETURN jsonb_build_object('published', false, 'flags', flags);
  END IF;
  UPDATE public.questions
  SET review_status = 'published', reviewed_by = auth.uid(), reviewed_at = now(), quality_flags = '[]'::jsonb
  WHERE id = _question_id;
  RETURN jsonb_build_object('published', true, 'flags', '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.question_quality_flags(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_question(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.question_quality_flags(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.publish_question(uuid) TO authenticated, service_role;

DROP VIEW IF EXISTS public.questions_safe;
CREATE VIEW public.questions_safe WITH (security_invoker = false) AS
SELECT
  id, question_text, options, allow_multiple_answers,
  question_type, subject, topic, subtopic, difficulty,
  points, max_marks, boards, formula, command_word, curriculum, created_at
FROM public.questions
WHERE review_status = 'published';
REVOKE ALL ON public.questions_safe FROM PUBLIC, anon;
GRANT SELECT ON public.questions_safe TO authenticated;

CREATE OR REPLACE FUNCTION public.get_mock_exam_questions(
  _subject text, _curriculum text, _count integer, _board text DEFAULT NULL::text
)
RETURNS TABLE(id uuid, question_text text, options jsonb, topic text, subject text, difficulty integer, points integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT q.id, q.question_text, q.options, q.topic, q.subject, q.difficulty, q.points
  FROM public.questions q
  WHERE q.subject = _subject
    AND q.curriculum = _curriculum
    AND q.review_status = 'published'
    AND q.question_type IN ('mcq', 'code', 'data-interpretation', 'assertion-reason')
    AND (_board IS NULL OR _board = ANY(q.boards))
  ORDER BY random()
  LIMIT LEAST(GREATEST(COALESCE(_count, 10), 1), 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_subject_question_counts()
RETURNS TABLE(subject text, question_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.subject, count(*)::bigint
  FROM public.questions q
  WHERE q.review_status = 'published'
  GROUP BY q.subject
$$;

-- Students cannot forge attempts or gamification state from the browser.
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.attempts;
REVOKE INSERT ON public.attempts FROM authenticated;
DROP POLICY IF EXISTS "Users can insert own challenge attempts" ON public.daily_challenge_attempts;
REVOKE INSERT ON public.daily_challenge_attempts FROM authenticated;
REVOKE ALL ON FUNCTION public.record_answer_stats(uuid, boolean, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_perfect_score(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.award_badge(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_used_questions(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_mock_exams_used(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.issue_certificate(uuid, text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_answer_stats(uuid, boolean, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_perfect_score(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.award_badge(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_used_questions(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_mock_exams_used(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid, text, text, text, integer) TO service_role;
REVOKE ALL ON FUNCTION public.record_daily_challenge_attempt(uuid, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_daily_challenge_attempt(uuid, integer, integer, integer) TO service_role;

-- A small, human-reviewed launch set. These remain idempotent by exact question text.
WITH seed(subject, topic, subtopic, curriculum, boards, difficulty, question_type, question_text, options,
          correct_answer, correct_answers, allow_multiple_answers, explanation, worked_solution, tuition_tips,
          exam_tip, formula, points, max_marks) AS (VALUES
  ('mathematics','Algebra','Quadratic equations','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'mcq',
   'Solve x² − 5x + 6 = 0.', '["x = 2 or x = 3","x = −2 or x = −3","x = 1 or x = 6","x = −1 or x = −6"]'::jsonb,
   'x = 2 or x = 3',ARRAY[]::text[],false,'The quadratic factors as (x − 2)(x − 3), so either factor may equal zero.',
   'Factor x² − 5x + 6 to get (x − 2)(x − 3) = 0. Therefore x = 2 or x = 3.',ARRAY['Look for two numbers whose product is 6 and sum is −5.'],'Check both roots by substitution.','(x − 2)(x − 3) = 0',2,2),
  ('mathematics','Calculus','Differentiation','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],4,'numerical',
   'For f(x) = 3x² + 2x − 5, find f′(4).',NULL,'26',ARRAY[]::text[],false,
   'Differentiate term by term: f′(x) = 6x + 2, then substitute x = 4.',
   'f′(x) = 6x + 2. Hence f′(4) = 6(4) + 2 = 26.',ARRAY['Differentiate before substituting the x-value.'],'A constant differentiates to zero.','d(xⁿ)/dx = nxⁿ⁻¹',3,3),
  ('mathematics','Statistics','Probability','ib-dp-sl',ARRAY['IB SL'],3,'multi-select',
   'Which two statements are always true for probabilities?', '["0 ≤ P(A) ≤ 1","P(A) + P(not A) = 1","P(A) must be greater than 0","P(A and B) = P(A)P(B) for all events"]'::jsonb,
   '',ARRAY['0 ≤ P(A) ≤ 1','P(A) + P(not A) = 1'],true,
   'Probabilities lie from 0 to 1 inclusive, and an event plus its complement has probability 1.',
   'Use the probability axioms: 0 ≤ P(A) ≤ 1 and P(Aᶜ) = 1 − P(A).',ARRAY['Do not assume events are independent unless told.'],'Test words such as “always” against impossible and certain events.',NULL,2,2),
  ('physics','Mechanics','Projectile motion','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],4,'mcq',
   'A ball is launched at 20 m s⁻¹ at 30° above the horizontal. Ignore air resistance and use g = 9.8 m s⁻². What maximum height does it gain?',
   '["3.2 m","5.1 m","10.2 m","20.4 m"]'::jsonb,'5.1 m',ARRAY[]::text[],false,
   'The initial vertical speed is 20 sin 30° = 10 m s⁻¹. At maximum height the vertical speed is zero.',
   'Use v² = u² + 2as vertically: 0 = 10² − 2(9.8)h, so h = 100/19.6 = 5.10 m.',ARRAY['Resolve the launch velocity into components first.'],'State the vertical maximum-height condition v = 0.','v² = u² + 2as',4,4),
  ('physics','Electricity','Power','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'numerical',
   'A 12 V lamp draws a current of 0.50 A. Calculate its power in watts.',NULL,'6 W',ARRAY[]::text[],false,
   'Electrical power equals potential difference multiplied by current.',
   'P = VI = 12 × 0.50 = 6 W.',ARRAY['Use volts and amperes to obtain watts.'],'Include the unit W.','P = VI',2,2),
  ('physics','Waves','Wave properties','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'multi-select',
   'Select the two quantities needed to calculate wave speed using v = fλ.',
   '["Frequency","Wavelength","Amplitude","Phase difference"]'::jsonb,'',ARRAY['Frequency','Wavelength'],true,
   'Wave speed is the product of frequency and wavelength.',
   'From v = fλ, identify f as frequency and λ as wavelength.',ARRAY['Match every symbol in the formula to its physical quantity.'],'Amplitude does not determine wave speed in this model.','v = fλ',2,2),
  ('chemistry','Stoichiometry','Moles','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'numerical',
   'Calculate the amount, in moles, in 9.0 g of water. Use Mᵣ(H₂O) = 18.0.',NULL,'0.50 mol',ARRAY[]::text[],false,
   'Amount in moles equals mass divided by molar mass.',
   'n = m/Mᵣ = 9.0/18.0 = 0.50 mol.',ARRAY['Write the molar mass before substituting.'],'Give a unit and suitable significant figures.','n = m/Mᵣ',2,2),
  ('chemistry','Atomic Structure','Isotopes','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'mcq',
   'Which statement correctly describes isotopes of the same element?',
   '["They have the same number of protons but different numbers of neutrons","They have different numbers of protons but the same number of neutrons","They have the same mass number but different atomic numbers","They always have different chemical properties"]'::jsonb,
   'They have the same number of protons but different numbers of neutrons',ARRAY[]::text[],false,
   'An element is defined by proton number. Isotopes differ only in neutron number.',
   'Same element means the same atomic number (protons); differing mass numbers arise from different neutron counts.',ARRAY['Anchor the definition to proton number.'],'Do not confuse isotopes with ions, which differ in electron number.',NULL,2,2),
  ('chemistry','Bonding','Intermolecular forces','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],4,'multi-select',
   'Which two features are required for hydrogen bonding between molecules?',
   '["Hydrogen bonded to N, O or F","A lone pair on N, O or F in a neighbouring molecule","Any polar C–H bond","A positive overall molecular charge"]'::jsonb,
   '',ARRAY['Hydrogen bonded to N, O or F','A lone pair on N, O or F in a neighbouring molecule'],true,
   'Hydrogen bonding needs a strongly polar H–N, H–O or H–F bond and an available lone pair on N, O or F nearby.',
   'Identify the hydrogen-bond donor and acceptor: X–H where X is N/O/F, and a lone pair on N/O/F.',ARRAY['Look for both a donor and an acceptor.'],'A molecule need not carry an overall charge.',NULL,3,3),
  ('biology','Cell Biology','Organelles','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'mcq',
   'Which organelle is the main site of aerobic respiration in a eukaryotic cell?',
   '["Mitochondrion","Ribosome","Nucleus","Golgi apparatus"]'::jsonb,'Mitochondrion',ARRAY[]::text[],false,
   'Most stages of aerobic respiration occur in mitochondria.',
   'Recall organelle functions: mitochondria release usable energy through aerobic respiration.',ARRAY['Link each organelle to one precise function.'],'Use the singular “mitochondrion” when naming one organelle.',NULL,1,1),
  ('biology','Genetics','DNA','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'multi-select',
   'Which two bases form complementary pairs in DNA?',
   '["Adenine with thymine","Cytosine with guanine","Adenine with uracil","Cytosine with thymine"]'::jsonb,
   '',ARRAY['Adenine with thymine','Cytosine with guanine'],true,
   'DNA base pairing is A–T and C–G. Uracil occurs in RNA rather than DNA.',
   'Apply complementary base-pairing rules: adenine pairs with thymine; cytosine pairs with guanine.',ARRAY['Remember AT and CG as fixed pairs.'],'Check whether the question asks about DNA or RNA.',NULL,2,2),
  ('biology','Ecology','Energy transfer','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],3,'numerical',
   'A producer stores 12,000 kJ of energy and the primary consumer stores 1,800 kJ. Calculate the percentage transfer efficiency.',NULL,'15%',ARRAY[]::text[],false,
   'Efficiency is useful energy transferred divided by energy available, multiplied by 100.',
   'Efficiency = (1,800/12,000) × 100 = 15%.',ARRAY['Use transferred ÷ available, not the reverse.'],'Show the fraction before multiplying by 100.','efficiency = useful output / total input × 100',3,3),
  ('computer-science','Programming','Python output','uk-gcse',ARRAY['AQA','OCR','Edexcel (Pearson)'],2,'code',
   E'What is printed by this Python code?\n\nx = 5\ny = 2\nprint(x ** y)',
   '["10","25","7","Error"]'::jsonb,'25',ARRAY[]::text[],false,
   'In Python, ** is the exponentiation operator, so 5 ** 2 means 5 squared.',
   'Evaluate the exponent first: 5² = 25. Therefore the program prints 25.',ARRAY['Trace operators using the language’s exact syntax.'],'Do not confuse ** (power) with * (multiplication).',NULL,2,2),
  ('computer-science','Algorithms','Complexity','us-ap',ARRAY['AP Computer Science A'],4,'mcq',
   'What is the worst-case time complexity of binary search on a sorted array of n items?',
   '["O(1)","O(log n)","O(n)","O(n²)"]'::jsonb,'O(log n)',ARRAY[]::text[],false,
   'Binary search halves the remaining search interval after each comparison.',
   'After k halvings, n/2ᵏ ≈ 1, so k ≈ log₂n and the complexity is O(log n).',ARRAY['Binary search requires ordered data.'],'Explain the repeated halving when justification is requested.',NULL,3,3),
  ('computer-science','Cybersecurity','Authentication','uk-gcse',ARRAY['AQA','OCR','Edexcel (Pearson)'],3,'assertion-reason',
   'Assertion: Multi-factor authentication can reduce account takeover risk. Reason: It requires evidence from more than one authentication factor.',
   '["Both are true and the reason explains the assertion","Both are true but the reason does not explain the assertion","The assertion is true but the reason is false","The assertion is false but the reason is true"]'::jsonb,
   'Both are true and the reason explains the assertion',ARRAY[]::text[],false,
   'Requiring independent factors makes a stolen password alone less likely to be enough for access.',
   'Evaluate each statement, then test the causal link: the second factor is precisely why takeover risk is reduced.',ARRAY['Treat assertion–reason questions as two truth checks plus one link check.'],'Examples of factors include knowledge, possession and inherence.',NULL,3,3)
)
INSERT INTO public.questions (
  subject, topic, subtopic, curriculum, boards, difficulty, question_type, question_text, options,
  correct_answer, correct_answers, allow_multiple_answers, explanation, worked_solution, tuition_tips,
  exam_tip, formula, points, max_marks, review_status, content_origin, specification_version, reviewed_at
)
SELECT s.*, 'published', 'human-reviewed-launch-seed', '2026 launch baseline', now()
FROM seed s
WHERE NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.question_text = s.question_text);

-- Create mistake flashcards without ever exposing answer-bearing question rows
-- to the browser. The caller can only create cards for their own attempts.
CREATE OR REPLACE FUNCTION public.create_flashcards_from_mistakes(_limit integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.flashcards (user_id, question_id, front, back, subject, topic)
  SELECT auth.uid(), q.id, q.question_text, q.correct_answer || E'\n\n' || q.explanation, q.subject, q.topic
  FROM (
    SELECT DISTINCT ON (a.question_id) a.question_id, a.created_at
    FROM public.attempts a
    WHERE a.user_id = auth.uid() AND a.correct = false
    ORDER BY a.question_id, a.created_at DESC
    LIMIT LEAST(GREATEST(COALESCE(_limit, 20), 1), 50)
  ) missed
  JOIN public.questions q ON q.id = missed.question_id AND q.review_status = 'published'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.flashcards f
    WHERE f.user_id = auth.uid() AND f.question_id = q.id
  );

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.create_flashcards_from_mistakes(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_flashcards_from_mistakes(integer) TO authenticated;
