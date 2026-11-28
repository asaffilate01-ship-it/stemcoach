-- SYNTHETIC TEST DATABASE ONLY. Never apply as a production migration.
-- The harness creates stemcoach_exam_fixture and the fixture marker first.
-- All tables below are isolated; no public questions, quotas or certificates are touched.
DO $fixture_guard$
BEGIN
  IF current_setting('stemcoach.fixture_mode', true) IS DISTINCT FROM 'isolated-mock-exam-v1' THEN
    RAISE EXCEPTION 'Use the isolated mock exam test harness';
  END IF;
END;
$fixture_guard$;

CREATE TABLE stemcoach_exam_fixture.questions (
  id uuid PRIMARY KEY,
  subject text NOT NULL,
  curriculum text NOT NULL,
  question_type text NOT NULL,
  review_status text NOT NULL,
  review_revision integer NOT NULL CHECK (review_revision >= 0),
  academic_verified_at timestamptz,
  academic_verified_by uuid,
  options jsonb NOT NULL,
  correct_answer text NOT NULL
);
CREATE TABLE stemcoach_exam_fixture.user_quotas (
  user_id uuid PRIMARY KEY,
  mock_exams_total integer NOT NULL CHECK (mock_exams_total >= 0),
  mock_exams_used integer NOT NULL CHECK (mock_exams_used BETWEEN 0 AND mock_exams_total)
);
CREATE TABLE stemcoach_exam_fixture.sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  curriculum text NOT NULL,
  expires_at timestamptz NOT NULL,
  UNIQUE (id, user_id)
);
CREATE TABLE stemcoach_exam_fixture.session_questions (
  session_id uuid NOT NULL REFERENCES stemcoach_exam_fixture.sessions(id),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 100),
  question_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision >= 0),
  PRIMARY KEY (session_id, position),
  UNIQUE (session_id, question_id)
);
CREATE TABLE stemcoach_exam_fixture.attempts (
  session_id uuid NOT NULL,
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer text NOT NULL,
  correct boolean NOT NULL,
  PRIMARY KEY (session_id, question_id),
  FOREIGN KEY (session_id, user_id) REFERENCES stemcoach_exam_fixture.sessions(id, user_id),
  FOREIGN KEY (session_id, question_id) REFERENCES stemcoach_exam_fixture.session_questions(session_id, question_id)
);
CREATE TABLE stemcoach_exam_fixture.certificates (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  score_percent integer NOT NULL CHECK (score_percent BETWEEN 60 AND 100),
  FOREIGN KEY (session_id, user_id) REFERENCES stemcoach_exam_fixture.sessions(id, user_id)
);
CREATE TABLE stemcoach_exam_fixture.receipts (
  session_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (session_id, user_id) REFERENCES stemcoach_exam_fixture.sessions(id, user_id)
);

-- Only the trusted server role may use this non-exposed fixture schema.
REVOKE ALL ON SCHEMA stemcoach_exam_fixture FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA stemcoach_exam_fixture TO service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA stemcoach_exam_fixture FROM PUBLIC, anon, authenticated, service_role;
DO $fixture_policies$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['questions','user_quotas','sessions','session_questions','attempts','certificates','receipts'] LOOP
    EXECUTE format('ALTER TABLE stemcoach_exam_fixture.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('CREATE POLICY server_only ON stemcoach_exam_fixture.%I TO service_role USING (true) WITH CHECK (true)', table_name);
  END LOOP;
END;
$fixture_policies$;
GRANT SELECT ON stemcoach_exam_fixture.questions, stemcoach_exam_fixture.user_quotas,
  stemcoach_exam_fixture.sessions, stemcoach_exam_fixture.session_questions,
  stemcoach_exam_fixture.receipts TO service_role;
-- Row-locking SELECTs also require an UPDATE privilege. The fixture server is trusted.
GRANT UPDATE (review_revision) ON stemcoach_exam_fixture.questions TO service_role;
GRANT UPDATE (expires_at) ON stemcoach_exam_fixture.sessions TO service_role;
GRANT UPDATE (mock_exams_used) ON stemcoach_exam_fixture.user_quotas TO service_role;
GRANT INSERT ON stemcoach_exam_fixture.attempts, stemcoach_exam_fixture.certificates,
  stemcoach_exam_fixture.receipts TO service_role;

-- p_actor MUST be derived from authenticated server-side identity, never from
-- the request body. The session/question snapshot is issued by trusted code.
-- Prototype deliberately supports academically verified, single-answer MCQs only.
CREATE FUNCTION stemcoach_exam_fixture.submit_mock_exam(
  p_actor uuid, p_session uuid, p_submissions jsonb
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $submit_mock_exam$
DECLARE
  v_session stemcoach_exam_fixture.sessions%ROWTYPE;
  v_receipt stemcoach_exam_fixture.receipts%ROWTYPE;
  v_entry jsonb;
  v_payload jsonb := '{}'::jsonb;
  v_id uuid;
  v_answer text;
  v_hash bytea;
  v_expected integer;
  v_question record;
  v_total integer := 0;
  v_score integer := 0;
  v_correct boolean;
  v_percent integer;
  v_certificate boolean;
  v_attempts jsonb := '[]'::jsonb;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
BEGIN
  IF p_actor IS NULL OR p_session IS NULL THEN
    RAISE EXCEPTION 'Exam session unavailable' USING ERRCODE = '42501';
  END IF;
  -- Serializes all submits for this exact server-owned session.
  SELECT s.* INTO v_session FROM stemcoach_exam_fixture.sessions s
    WHERE s.id = p_session AND s.user_id = p_actor FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam session unavailable' USING ERRCODE = '42501';
  END IF;

  IF p_submissions IS NULL OR jsonb_typeof(p_submissions) <> 'array' THEN
    RAISE EXCEPTION 'Invalid submission array' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_submissions) NOT BETWEEN 1 AND 100 OR octet_length(p_submissions::text) > 1000000 THEN
    RAISE EXCEPTION 'Invalid submission size' USING ERRCODE = '22023';
  END IF;
  FOR v_entry IN SELECT value FROM jsonb_array_elements(p_submissions) LOOP
    IF jsonb_typeof(v_entry) <> 'object' THEN
      RAISE EXCEPTION 'Invalid submission row' USING ERRCODE = '22023';
    END IF;
    IF (SELECT count(*) FROM jsonb_object_keys(v_entry)) <> 2
      OR NOT (v_entry ? 'question_id' AND v_entry ? 'answer')
      OR jsonb_typeof(v_entry->'question_id') <> 'string'
      OR (v_entry->>'question_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      OR jsonb_typeof(v_entry->'answer') NOT IN ('null','string') THEN
      RAISE EXCEPTION 'Invalid submission row' USING ERRCODE = '22023';
    END IF;
    v_id := (v_entry->>'question_id')::uuid;
    IF v_payload ? v_id::text THEN
      RAISE EXCEPTION 'Duplicate question' USING ERRCODE = '22023';
    END IF;
    IF length(v_entry->>'answer') > 2000 THEN
      RAISE EXCEPTION 'Answer too long' USING ERRCODE = '22023';
    END IF;
    v_answer := nullif(btrim(v_entry->>'answer', E' \t\r\n'), '');
    v_payload := v_payload || jsonb_build_object(v_id::text, v_answer);
  END LOOP;

  -- Canonical JSONB object keyed by UUID: independent of the supplied row order.
  -- Hash stays server-side. No answer key, submitted answer or hash is returned.
  v_hash := sha256(convert_to(v_payload::text, 'UTF8'));
  SELECT r.* INTO v_receipt FROM stemcoach_exam_fixture.receipts r
    WHERE r.session_id = p_session AND r.user_id = p_actor;
  IF FOUND THEN
    IF v_receipt.request_hash IS DISTINCT FROM v_hash THEN
      RAISE EXCEPTION 'Submission differs from completed receipt' USING ERRCODE = '22023';
    END IF;
    RETURN v_receipt.result;
  END IF;

  IF clock_timestamp() >= v_session.expires_at THEN
    RAISE EXCEPTION 'Exam session expired' USING ERRCODE = '22023';
  END IF;
  SELECT count(*) INTO v_expected FROM stemcoach_exam_fixture.session_questions sq
    WHERE sq.session_id = p_session;
  IF v_expected <> jsonb_array_length(p_submissions) OR EXISTS (
    SELECT 1 FROM stemcoach_exam_fixture.session_questions sq
    WHERE sq.session_id = p_session AND NOT (v_payload ? sq.question_id::text)
  ) THEN
    RAISE EXCEPTION 'Submission does not match assigned questions' USING ERRCODE = '22023';
  END IF;

  -- Lock question rows against concurrent changes. Missing rows fail closed.
  FOR v_question IN
    SELECT sq.position, sq.question_id, sq.revision, q.subject, q.curriculum,
      q.question_type, q.review_status, q.review_revision, q.academic_verified_at,
      q.academic_verified_by, q.options, q.correct_answer
    FROM stemcoach_exam_fixture.session_questions sq
    JOIN stemcoach_exam_fixture.questions q ON q.id = sq.question_id
    WHERE sq.session_id = p_session ORDER BY sq.position FOR SHARE OF q
  LOOP
    IF v_question.subject <> v_session.subject OR v_question.curriculum <> v_session.curriculum
      OR v_question.review_status <> 'published' OR v_question.review_revision <> v_question.revision
      OR v_question.academic_verified_at IS NULL OR v_question.academic_verified_by IS NULL
      OR v_question.question_type <> 'mcq'
      OR nullif(btrim(v_question.correct_answer, E' \t\r\n'), '') IS NULL
      OR jsonb_typeof(v_question.options) <> 'array' THEN
      RAISE EXCEPTION 'Assigned question changed or not gradeable' USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(v_question.options) NOT BETWEEN 2 AND 8
      OR EXISTS (SELECT 1 FROM jsonb_array_elements(v_question.options) e(value)
        WHERE jsonb_typeof(e.value) <> 'string' OR nullif(btrim(e.value#>>'{}', E' \t\r\n'), '') IS NULL
          OR (e.value#>>'{}') <> btrim(e.value#>>'{}', E' \t\r\n'))
      OR (SELECT count(DISTINCT value) FROM jsonb_array_elements(v_question.options)) <> jsonb_array_length(v_question.options)
      OR NOT (v_question.options ? v_question.correct_answer) THEN
      RAISE EXCEPTION 'Invalid assigned answer choices' USING ERRCODE = '22023';
    END IF;
    v_answer := v_payload->>v_question.question_id::text;
    IF v_answer IS NOT NULL AND NOT (v_question.options ? v_answer) THEN
      RAISE EXCEPTION 'Answer is not an assigned option' USING ERRCODE = '22023';
    END IF;
    v_correct := v_answer IS NOT NULL AND v_answer = v_question.correct_answer;
    v_total := v_total + 1;
    IF v_correct THEN v_score := v_score + 1; END IF;
    IF v_answer IS NOT NULL THEN
      v_attempts := v_attempts || jsonb_build_array(jsonb_build_object(
        'question_id', v_question.question_id, 'answer', v_answer, 'correct', v_correct));
    END IF;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'question_id', v_question.question_id, 'correct', v_correct));
  END LOOP;
  IF v_total <> v_expected OR v_total = 0 THEN
    RAISE EXCEPTION 'Assigned questions unavailable' USING ERRCODE = '22023';
  END IF;

  -- One conditional UPDATE is the allowance gate. It serializes competing
  -- sessions for the same learner; PostgreSQL rechecks the predicate on lock wait.
  UPDATE stemcoach_exam_fixture.user_quotas
    SET mock_exams_used = mock_exams_used + 1
    WHERE user_id = p_actor AND mock_exams_used < mock_exams_total;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mock-exam allowance exhausted' USING ERRCODE = '22023';
  END IF;
  INSERT INTO stemcoach_exam_fixture.attempts(session_id,user_id,question_id,answer,correct)
    SELECT p_session,p_actor,a.question_id,a.answer,a.correct
    FROM jsonb_to_recordset(v_attempts) AS a(question_id uuid, answer text, correct boolean);

  v_percent := round(100::numeric * v_score / v_total)::integer;
  v_certificate := v_percent >= 60;
  IF v_certificate THEN
    INSERT INTO stemcoach_exam_fixture.certificates(session_id,user_id,score_percent)
      VALUES (p_session,p_actor,v_percent);
  END IF;
  v_result := jsonb_build_object('score',v_score,'total',v_total,'percent',v_percent,
    'results',v_results,'certificate_issued',v_certificate);
  INSERT INTO stemcoach_exam_fixture.receipts(session_id,user_id,request_hash,result)
    VALUES(p_session,p_actor,v_hash,v_result);
  -- No exception swallowing: all writes roll back if any step fails.
  RETURN v_result;
END;
$submit_mock_exam$;
REVOKE ALL ON FUNCTION stemcoach_exam_fixture.submit_mock_exam(uuid,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION stemcoach_exam_fixture.submit_mock_exam(uuid,uuid,jsonb) TO service_role;
