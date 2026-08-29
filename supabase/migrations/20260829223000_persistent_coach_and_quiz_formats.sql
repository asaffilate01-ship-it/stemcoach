-- Persist a learner's chosen STEM Squad coach across devices.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_mascot text NOT NULL DEFAULT 'stemcoach';

ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_preferred_mascot_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_preferred_mascot_check
  CHECK (preferred_mascot IN (
    'stemcoach', 'mathematics', 'physics', 'chemistry', 'biology', 'computer-science',
    'economics', 'english-literature', 'psychology', 'geography', 'business-studies',
    'ielts', 'celta', 'french', 'german'
  ));

-- Add interaction formats that have deterministic server-side grading.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check
  CHECK (question_type IN (
    'mcq', 'multi-select', 'numerical', 'multi-step', 'essay', 'code',
    'data-interpretation', 'assertion-reason', 'true-false', 'ordering', 'short-answer'
  ));

-- Initial scalable campaign schema. The later two-million migration raises the target
-- and adds resumable queue planning without rewriting this applied migration.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.generation_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_questions integer NOT NULL CHECK (target_questions BETWEEN 1000 AND 250000),
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','queued','running','paused','completed','failed')),
  generated_questions integer NOT NULL DEFAULT 0,
  reviewed_questions integer NOT NULL DEFAULT 0,
  published_questions integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage generation campaigns" ON public.generation_campaigns;
CREATE POLICY "Admins manage generation campaigns" ON public.generation_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Keep each STEM Team coaching thread available when the learner returns or changes device.
CREATE TABLE IF NOT EXISTS public.coach_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coach_conversations_user_subject_key UNIQUE (user_id, subject),
  CONSTRAINT coach_conversations_messages_check CHECK (jsonb_typeof(messages) = 'array' AND jsonb_array_length(messages) <= 60)
);

ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own coach conversations" ON public.coach_conversations;
CREATE POLICY "Users manage own coach conversations" ON public.coach_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS coach_conversations_user_updated_idx ON public.coach_conversations(user_id, updated_at DESC);

ALTER TABLE public.generation_queue
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.generation_campaigns(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS generated_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.generation_queue DROP CONSTRAINT IF EXISTS generation_queue_status_check;
ALTER TABLE public.generation_queue ADD CONSTRAINT generation_queue_status_check
  CHECK (status IN ('pending','processing','done','failed','cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS generation_queue_campaign_dimension_key
  ON public.generation_queue(campaign_id, subject, topic, subtopic, curriculum, boards, difficulty, question_type)
  WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS generation_queue_claim_idx
  ON public.generation_queue(status, attempts, created_at);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS generation_campaign_id uuid REFERENCES public.generation_campaigns(id) ON DELETE SET NULL;

UPDATE public.questions
SET content_hash = encode(extensions.digest(
  lower(trim(regexp_replace(subject || '|' || curriculum || '|' || question_text, '\s+', ' ', 'g'))),
  'sha256'
), 'hex')
WHERE content_hash IS NULL;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY subject, curriculum, content_hash ORDER BY created_at, id) AS duplicate_rank
  FROM public.questions
)
UPDATE public.questions q
SET content_hash = q.content_hash || ':' || q.id::text,
    review_status = 'archived',
    quality_flags = coalesce(q.quality_flags, '[]'::jsonb) || '"duplicate_content"'::jsonb
FROM ranked r
WHERE q.id = r.id AND r.duplicate_rank > 1;

ALTER TABLE public.questions ALTER COLUMN content_hash SET NOT NULL;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_content_identity_key;
ALTER TABLE public.questions ADD CONSTRAINT questions_content_identity_key UNIQUE (subject, curriculum, content_hash);

CREATE OR REPLACE FUNCTION public.set_question_content_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
BEGIN
  NEW.content_hash := encode(extensions.digest(
    lower(trim(regexp_replace(NEW.subject || '|' || NEW.curriculum || '|' || NEW.question_text, '\s+', ' ', 'g'))),
    'sha256'
  ), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_question_content_hash_trigger ON public.questions;
CREATE TRIGGER set_question_content_hash_trigger
BEFORE INSERT OR UPDATE OF subject, curriculum, question_text ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.set_question_content_hash();

CREATE OR REPLACE FUNCTION public.refresh_generation_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign uuid;
  remaining integer;
  failed_jobs integer;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.campaign_id ELSE NEW.campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  SELECT count(*) INTO remaining FROM public.generation_queue
  WHERE campaign_id = campaign AND status IN ('pending','processing');
  SELECT count(*) INTO failed_jobs FROM public.generation_queue
  WHERE campaign_id = campaign AND status = 'failed';
  UPDATE public.generation_campaigns
  SET generated_questions = (SELECT coalesce(sum(generated_count), 0) FROM public.generation_queue WHERE campaign_id = campaign),
      status = CASE
        WHEN remaining = 0 AND failed_jobs > 0 THEN 'failed'
        WHEN remaining = 0 THEN 'completed'
        ELSE 'running'
      END,
      updated_at = now()
  WHERE id = campaign;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_generation_campaign_trigger ON public.generation_queue;
CREATE TRIGGER refresh_generation_campaign_trigger
AFTER UPDATE OF status, generated_count OR DELETE ON public.generation_queue
FOR EACH ROW EXECUTE FUNCTION public.refresh_generation_campaign();

CREATE OR REPLACE FUNCTION public.refresh_generation_review_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign uuid;
BEGIN
  campaign := CASE WHEN TG_OP = 'DELETE' THEN OLD.generation_campaign_id ELSE NEW.generation_campaign_id END;
  IF campaign IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;
  UPDATE public.generation_campaigns
  SET reviewed_questions = (SELECT count(*) FROM public.questions WHERE generation_campaign_id = campaign AND reviewed_at IS NOT NULL),
      published_questions = (SELECT count(*) FROM public.questions WHERE generation_campaign_id = campaign AND review_status = 'published'),
      updated_at = now()
  WHERE id = campaign;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_generation_review_counts_trigger ON public.questions;
CREATE TRIGGER refresh_generation_review_counts_trigger
AFTER UPDATE OF review_status, reviewed_at OR DELETE ON public.questions
FOR EACH ROW EXECUTE FUNCTION public.refresh_generation_review_counts();

CREATE OR REPLACE FUNCTION public.claim_generation_queue(_limit integer DEFAULT 3)
RETURNS SETOF public.generation_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    RAISE EXCEPTION 'Service role required' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM public.generation_queue
    WHERE status = 'pending' AND attempts < 3
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(coalesce(_limit, 3), 1), 10)
  )
  UPDATE public.generation_queue q
  SET status = 'processing', claimed_at = now(), attempts = attempts + 1, last_error = NULL
  FROM claimed
  WHERE q.id = claimed.id
  RETURNING q.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_generation_queue(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_generation_queue(integer) TO service_role;

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
  IF coalesce(array_length(q.boards, 1), 0) < 1 THEN flags := flags || '"board_mapping_missing"'::jsonb; END IF;
  IF length(trim(coalesce(q.specification_version, ''))) < 5 THEN flags := flags || '"specification_version_missing"'::jsonb; END IF;
  IF q.content_origin LIKE 'ai-%' AND coalesce(q.source_url, '') !~ '^https://' THEN flags := flags || '"official_source_url_missing"'::jsonb; END IF;

  IF q.question_type IN ('mcq', 'code', 'data-interpretation', 'assertion-reason') THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' THEN
      flags := flags || '"options_missing"'::jsonb;
    ELSE
      option_count := jsonb_array_length(q.options);
      IF option_count < 3 OR option_count > 6 THEN flags := flags || '"invalid_option_count"'::jsonb; END IF;
      IF NOT (q.options @> jsonb_build_array(q.correct_answer)) THEN flags := flags || '"answer_not_in_options"'::jsonb; END IF;
    END IF;
  ELSIF q.question_type = 'true-false' THEN
    IF q.options IS NULL OR q.options <> '["True", "False"]'::jsonb THEN flags := flags || '"true_false_options_invalid"'::jsonb; END IF;
    IF q.correct_answer NOT IN ('True', 'False') THEN flags := flags || '"true_false_answer_invalid"'::jsonb; END IF;
  ELSIF q.question_type = 'ordering' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 3 THEN flags := flags || '"ordering_items_missing"'::jsonb; END IF;
    IF position(' → ' in q.correct_answer) = 0 THEN flags := flags || '"ordering_answer_invalid"'::jsonb; END IF;
    IF q.options IS NOT NULL AND EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(q.options) AS ordered_option(value)
      WHERE position(ordered_option.value in q.correct_answer) = 0
    ) THEN flags := flags || '"ordering_answer_incomplete"'::jsonb; END IF;
  ELSIF q.question_type = 'multi-select' THEN
    IF q.options IS NULL OR jsonb_typeof(q.options) <> 'array' OR jsonb_array_length(q.options) < 4 THEN flags := flags || '"options_missing"'::jsonb; END IF;
    IF coalesce(array_length(q.correct_answers, 1), 0) < 2 THEN flags := flags || '"multiple_answers_missing"'::jsonb; END IF;
    IF q.options IS NOT NULL AND EXISTS (
      SELECT 1 FROM unnest(coalesce(q.correct_answers, ARRAY[]::text[])) AS accepted_answer(value)
      WHERE NOT (q.options @> jsonb_build_array(accepted_answer.value))
    ) THEN flags := flags || '"multi_select_answer_not_in_options"'::jsonb; END IF;
  ELSIF q.question_type = 'numerical' THEN
    IF trim(q.correct_answer) !~ '[-+]?[0-9]' THEN flags := flags || '"numeric_answer_missing"'::jsonb; END IF;
  ELSIF q.question_type = 'short-answer' THEN
    IF length(trim(q.correct_answer)) < 2 THEN flags := flags || '"short_answer_missing"'::jsonb; END IF;
  ELSE
    IF length(trim(coalesce(q.mark_scheme, ''))) < 20 THEN flags := flags || '"mark_scheme_missing"'::jsonb; END IF;
    IF length(trim(coalesce(q.model_answer, ''))) < 30 THEN flags := flags || '"model_answer_missing"'::jsonb; END IF;
  END IF;

  RETURN flags;
END;
$$;

-- Twenty additional, deterministic launch questions across the five core STEM subjects.
-- Every answer and worked solution in this set has been independently recalculated in the repository tests.
WITH seed(subject, topic, subtopic, curriculum, boards, difficulty, question_type, question_text, options,
          correct_answer, correct_answers, allow_multiple_answers, explanation, worked_solution, tuition_tips,
          exam_tip, formula, points, max_marks) AS (VALUES
  ('mathematics','Algebra','Linear equations','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'ordering',
   'Put the steps for solving 2(x + 3) = 14 into a logically correct order.',
   '["Subtract 3: x = 4","Start with 2(x + 3) = 14","Check: 2(4 + 3) = 14","Divide both sides by 2: x + 3 = 7"]'::jsonb,
   'Start with 2(x + 3) = 14 → Divide both sides by 2: x + 3 = 7 → Subtract 3: x = 4 → Check: 2(4 + 3) = 14',ARRAY[]::text[],false,
   'Use inverse operations in reverse order and finish by substituting the value into the original equation.',
   'First divide both sides by 2 to obtain x + 3 = 7. Then subtract 3 to obtain x = 4. Substitution gives 14, so the solution is correct.',
   ARRAY['Undo multiplication before undoing addition.'],'Keep an equality sign in every algebra step.',NULL,2,2),
  ('mathematics','Statistics','Correlation','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'true-false',
   'A strong correlation between two variables proves that a change in one variable causes the change in the other.',
   '["True","False"]'::jsonb,'False',ARRAY[]::text[],false,
   'Correlation measures association, but a third variable or coincidence can produce an association without causation.',
   'A strong correlation is evidence of a relationship only. Establishing causation needs a suitable design that controls alternative explanations.',
   ARRAY['Use the phrase “correlation does not imply causation”.'],'Do not claim causation from a scatter graph alone.',NULL,1,1),
  ('mathematics','Graphs','Straight-line graphs','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'data-interpretation',
   E'A table gives points on a straight line:\n\nx: 1, 2, 3, 4\ny: 3, 5, 7, 9\n\nWhat is the gradient of the line?',
   '["1","2","3","5"]'::jsonb,'2',ARRAY[]::text[],false,
   'Each increase of 1 in x produces an increase of 2 in y, so change in y divided by change in x is 2.',
   'Choose any two points, for example (1,3) and (4,9). Gradient = (9 − 3)/(4 − 1) = 6/3 = 2.',
   ARRAY['Use two points that are far apart to reduce reading error.'],'Write gradient as change in y divided by change in x.','m = Δy/Δx',2,2),
  ('mathematics','Statistics','Averages','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],1,'short-answer',
   'What name is given to the middle value when a data set has been arranged in numerical order?',NULL,'median',ARRAY[]::text[],false,
   'The median is the central value in an ordered data set; it is not necessarily the most frequent value.',
   'Order all values. Select the single middle value, or average the two middle values when the number of values is even.',
   ARRAY['Always order the data before finding the median.'],'Distinguish median from mean and mode.',NULL,1,1),

  ('physics','Mechanics','Acceleration','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'data-interpretation',
   E'A trolley has the following velocity data:\n\ntime / s: 0, 2, 4, 6\nvelocity / m s⁻¹: 0, 6, 12, 18\n\nWhat is its constant acceleration?',
   '["2 m s⁻²","3 m s⁻²","6 m s⁻²","18 m s⁻²"]'::jsonb,'3 m s⁻²',ARRAY[]::text[],false,
   'Velocity rises by 6 m s⁻¹ every 2 seconds, giving an acceleration of 3 m s⁻².',
   'Acceleration = change in velocity/change in time = (18 − 0)/(6 − 0) = 3 m s⁻².',
   ARRAY['Acceleration is the gradient of a velocity–time graph.'],'Include the acceleration unit m s⁻².','a = Δv/Δt',2,2),
  ('physics','Mechanics','Mass and weight','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'true-false',
   'An astronaut’s mass becomes smaller when the astronaut travels from Earth to the Moon.',
   '["True","False"]'::jsonb,'False',ARRAY[]::text[],false,
   'Mass is the amount of matter and remains constant; weight changes because gravitational field strength changes.',
   'Use W = mg. The astronaut has the same mass m, but the Moon has a smaller g, so only the weight W decreases.',
   ARRAY['Mass is measured in kilograms; weight is measured in newtons.'],'State which quantity changes and why.','W = mg',1,1),
  ('physics','Mechanics','Newton''s second law','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],3,'short-answer',
   'Which physical quantity is equal to the rate of change of momentum?',NULL,'resultant force',ARRAY[]::text[],false,
   'Newton’s second law states that resultant force equals the rate of change of momentum.',
   'From F = Δp/Δt, identify F as the resultant or net force acting on the object.',
   ARRAY['Use “resultant force” rather than naming one component force.'],'Quote the momentum form of Newton’s second law.','F = Δp/Δt',2,2),
  ('physics','Electricity','Circuit investigation','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'ordering',
   'Order the main steps for measuring the resistance of a fixed resistor using an ammeter and voltmeter.',
   '["Calculate R = V/I","Record the current and potential difference","Connect the ammeter in series and voltmeter in parallel","Switch on the circuit"]'::jsonb,
   'Connect the ammeter in series and voltmeter in parallel → Switch on the circuit → Record the current and potential difference → Calculate R = V/I',ARRAY[]::text[],false,
   'The meters must first be connected correctly, then readings can be taken and used in Ohm’s law.',
   'Place the ammeter in series and voltmeter across the resistor. Switch on briefly, record I and V, then calculate resistance using R = V/I.',
   ARRAY['An ammeter is series; a voltmeter is parallel.'],'Switch off between readings to reduce heating.','R = V/I',2,2),

  ('chemistry','Kinetics','Catalysts and equilibrium','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],4,'true-false',
   'Adding a catalyst to a reversible reaction changes the equilibrium yield of products.',
   '["True","False"]'::jsonb,'False',ARRAY[]::text[],false,
   'A catalyst speeds both forward and reverse reactions but does not change the equilibrium constant or equilibrium position.',
   'The catalyst provides lower-activation-energy pathways in both directions. Equilibrium is reached faster, but its composition is unchanged.',
   ARRAY['Separate rate effects from equilibrium-position effects.'],'Say that both reaction directions are accelerated.',NULL,2,2),
  ('chemistry','Acids and bases','pH data','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'data-interpretation',
   E'Four solutions have pH values: P = 2, Q = 6, R = 7, S = 12. Which solution is the most alkaline?',
   '["P","Q","R","S"]'::jsonb,'S',ARRAY[]::text[],false,
   'On the usual aqueous pH scale, the highest pH value represents the most alkaline solution.',
   'Compare the values: 12 is higher than 7, 6 and 2. Therefore solution S is the most alkaline.',
   ARRAY['Acidic solutions are below 7 and alkaline solutions are above 7.'],'Use “alkaline” for an aqueous base.',NULL,1,1),
  ('chemistry','Acids and bases','Brønsted–Lowry theory','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],3,'short-answer',
   'In Brønsted–Lowry theory, what term describes a species that accepts a proton?',NULL,'base',ARRAY[]::text[],false,
   'A Brønsted–Lowry base is a proton acceptor, while a Brønsted–Lowry acid is a proton donor.',
   'Identify the direction of proton transfer: the accepting species gains H⁺ and is therefore the base.',
   ARRAY['Remember: acid donates, base accepts.'],'Name the theory if the question asks for a definition.',NULL,1,1),
  ('chemistry','Practical chemistry','Acid–base titration','uk-alevel',ARRAY['AQA','Edexcel (Pearson)','OCR'],3,'ordering',
   'Put these titration actions into the correct experimental order after the apparatus has been rinsed.',
   '["Add titrant slowly near the end point","Pipette the analyte into the conical flask and add indicator","Record the final burette reading","Fill the burette with titrant and record the initial reading"]'::jsonb,
   'Fill the burette with titrant and record the initial reading → Pipette the analyte into the conical flask and add indicator → Add titrant slowly near the end point → Record the final burette reading',ARRAY[]::text[],false,
   'A valid titre requires initial and final burette readings, with controlled addition of titrant near the end point.',
   'Fill and read the burette first. Prepare the measured analyte, titrate while swirling and add dropwise near the end point, then take the final reading.',
   ARRAY['Read the burette at eye level from the appropriate meniscus.'],'Repeat until concordant titres are obtained.',NULL,3,3),

  ('biology','Cell Biology','Mitosis','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'ordering',
   'Place the named stages of mitosis in their usual sequence.',
   '["Anaphase","Prophase","Telophase","Metaphase"]'::jsonb,
   'Prophase → Metaphase → Anaphase → Telophase',ARRAY[]::text[],false,
   'The standard mitosis sequence is prophase, metaphase, anaphase and telophase.',
   'Chromosomes condense in prophase, align in metaphase, separate in anaphase and reach opposite poles as nuclei reform in telophase.',
   ARRAY['Use the mnemonic PMAT.'],'Describe chromosome behaviour when more detail is required.',NULL,2,2),
  ('biology','Infection and response','Antibiotics','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'true-false',
   'Antibiotics can be used to kill viruses inside human body cells.',
   '["True","False"]'::jsonb,'False',ARRAY[]::text[],false,
   'Antibiotics target bacterial structures or processes and do not kill viruses, which replicate using host cells.',
   'Viruses lack the cellular targets on which antibiotics act. Antiviral strategies and immune responses are used instead.',
   ARRAY['Do not use “antibiotic” as a general word for medicine.'],'State that antibiotics treat bacterial, not viral, infections.',NULL,1,1),
  ('biology','Bioenergetics','Enzyme activity','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],2,'data-interpretation',
   E'An enzyme experiment gives these rates:\n\ntemperature / °C: 10, 20, 30, 40, 50\nrate / arbitrary units: 2, 5, 9, 12, 3\n\nWhat is the optimum temperature in this experiment?',
   '["10 °C","30 °C","40 °C","50 °C"]'::jsonb,'40 °C',ARRAY[]::text[],false,
   'The measured rate is greatest at 40 °C, so this is the optimum among the temperatures tested.',
   'Find the maximum rate in the table: 12 arbitrary units. The corresponding temperature is 40 °C.',
   ARRAY['The optimum is where the observed rate is highest.'],'Say “among the temperatures tested” when using discrete data.',NULL,2,2),
  ('biology','Cell Biology','Transport in cells','uk-gcse',ARRAY['AQA','Edexcel (Pearson)','OCR'],1,'short-answer',
   'What is the net movement of particles from a region of higher concentration to a region of lower concentration called?',NULL,'diffusion',ARRAY[]::text[],false,
   'Diffusion is the net movement of particles down a concentration gradient due to random motion.',
   'Identify the direction from higher to lower concentration; this movement down the gradient is diffusion.',
   ARRAY['Include “net movement” in a full definition.'],'Do not add a membrane requirement to the definition of diffusion.',NULL,1,1),

  ('computer-science','Computer systems','Fetch–decode–execute cycle','uk-gcse',ARRAY['AQA','OCR','Edexcel (Pearson)'],2,'ordering',
   'Put the three main stages of the processor instruction cycle in order.',
   '["Execute the instruction","Fetch the instruction from memory","Decode the instruction"]'::jsonb,
   'Fetch the instruction from memory → Decode the instruction → Execute the instruction',ARRAY[]::text[],false,
   'The processor repeatedly fetches an instruction, decodes what it means and then executes it.',
   'The program counter identifies the next instruction for fetching. The control unit decodes it, and the processor then carries out the operation.',
   ARRAY['Remember the cycle as FDE.'],'Use register names only when the specification requires them.',NULL,2,2),
  ('computer-science','Cybersecurity','Hashing','uk-gcse',ARRAY['AQA','OCR','Edexcel (Pearson)'],3,'true-false',
   'A cryptographic password hash is designed to be decrypted with a secret key to recover the original password.',
   '["True","False"]'::jsonb,'False',ARRAY[]::text[],false,
   'Hashing is designed as a one-way transformation; encryption is reversible when the correct key is available.',
   'A login system hashes the submitted password and compares hashes. It should not decrypt a stored hash to obtain the original password.',
   ARRAY['Distinguish hashing from encryption.'],'Mention salts when explaining secure password storage.',NULL,2,2),
  ('computer-science','Algorithms','Complexity data','us-ap',ARRAY['AP Computer Science A'],4,'data-interpretation',
   E'For input sizes n = 10, 20, 40, an algorithm performs about 100, 400, 1600 operations. Which growth rate best fits the data?',
   '["O(1)","O(log n)","O(n)","O(n²)"]'::jsonb,'O(n²)',ARRAY[]::text[],false,
   'Doubling n multiplies the operation count by four, which is characteristic of quadratic growth.',
   '10² = 100, 20² = 400 and 40² = 1600. The measurements therefore fit an O(n²) relationship.',
   ARRAY['Compare how the count changes when n doubles.'],'Big-O describes growth, not an exact running time.','operations ∝ n²',3,3),
  ('computer-science','Cybersecurity','Social engineering','uk-gcse',ARRAY['AQA','OCR','Edexcel (Pearson)'],2,'short-answer',
   'What is the common name for a fraudulent message designed to trick someone into revealing login details?',NULL,'phishing',ARRAY[]::text[],false,
   'Phishing uses deceptive messages or websites to obtain credentials or other sensitive information.',
   'The clue is a fraudulent communication that impersonates a trusted source and asks for login details: this is phishing.',
   ARRAY['Look for impersonation, urgency and suspicious links.'],'Spell the security term precisely.',NULL,1,1)
)
INSERT INTO public.questions (
  subject, topic, subtopic, curriculum, boards, difficulty, question_type, question_text, options,
  correct_answer, correct_answers, allow_multiple_answers, explanation, worked_solution, tuition_tips,
  exam_tip, formula, points, max_marks, review_status, content_origin, specification_version, reviewed_at
)
SELECT s.*, 'published', 'editorial-launch-seed', '2026-08 core concept review', now()
FROM seed s
WHERE NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.question_text = s.question_text);

-- Data API grants for the new tables (RLS above governs row visibility).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_conversations TO authenticated;
GRANT ALL ON public.coach_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generation_campaigns TO authenticated;
GRANT ALL ON public.generation_campaigns TO service_role;
