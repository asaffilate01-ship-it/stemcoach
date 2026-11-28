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
  boards text[] NOT NULL DEFAULT ARRAY[]::text[],
  question_type text NOT NULL,
  review_status text NOT NULL,
  review_revision integer NOT NULL CHECK (review_revision >= 0),
  academic_verified_at timestamptz,
  academic_verified_by uuid,
  options jsonb,
  question_text text NOT NULL DEFAULT 'Synthetic fixture question',
  topic text NOT NULL DEFAULT 'Synthetic fixture topic',
  difficulty integer NOT NULL DEFAULT 2,
  points integer NOT NULL DEFAULT 1,
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
  board text,
  expires_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  request_id uuid,
  requested_count integer CHECK (requested_count BETWEEN 1 AND 100),
  duration_seconds integer CHECK (duration_seconds BETWEEN 60 AND 10800),
  CHECK ((request_id IS NULL AND requested_count IS NULL AND duration_seconds IS NULL) OR
    (request_id IS NOT NULL AND requested_count IS NOT NULL AND duration_seconds IS NOT NULL)),
  UNIQUE (user_id, request_id),
  UNIQUE (id, user_id)
);
CREATE TABLE stemcoach_exam_fixture.session_questions (
  session_id uuid NOT NULL REFERENCES stemcoach_exam_fixture.sessions(id),
  position integer NOT NULL CHECK (position BETWEEN 1 AND 100),
  question_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision >= 0),
  stem_snapshot text,
  options_snapshot jsonb,
  topic_snapshot text,
  difficulty_snapshot integer,
  points_snapshot integer,
  key_digest bytea CHECK (octet_length(key_digest)=32),
  CHECK ((stem_snapshot IS NULL) = (options_snapshot IS NULL)),
  CHECK ((stem_snapshot IS NULL) = (key_digest IS NULL)),
  CHECK ((stem_snapshot IS NULL) = (topic_snapshot IS NULL)),
  CHECK ((stem_snapshot IS NULL) = (difficulty_snapshot IS NULL)),
  CHECK ((stem_snapshot IS NULL) = (points_snapshot IS NULL)),
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
GRANT UPDATE (expires_at, cancelled_at) ON stemcoach_exam_fixture.sessions TO service_role;
GRANT UPDATE (mock_exams_used) ON stemcoach_exam_fixture.user_quotas TO service_role;
GRANT INSERT ON stemcoach_exam_fixture.attempts, stemcoach_exam_fixture.certificates,
  stemcoach_exam_fixture.receipts TO service_role;

-- Quality helpers mirror the separate selector fixture; regression tests check parity.
CREATE FUNCTION stemcoach_exam_fixture.canonical_choice(p_value text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $choice_normalisation$
  SELECT lower(btrim(normalize(p_value,NFKC),
    E' \t\n\r\f' || chr(11) || chr(160) || chr(5760) || chr(8192) || chr(8193) || chr(8194) ||
    chr(8195) || chr(8196) || chr(8197) || chr(8198) || chr(8199) || chr(8200) ||
    chr(8201) || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287) ||
    chr(12288) || chr(65279)));
$choice_normalisation$;

-- Decode an array or one historical string-encoded array. Fail closed on
-- malformed JSONB input (including invalid Unicode escape sequences).
-- Return original choice text, never the private key or its normalised value.
CREATE FUNCTION stemcoach_exam_fixture.usable_options(p_options jsonb,p_key text)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $option_validation$
DECLARE
  v_options jsonb;
  v_text text;
  v_choice jsonb;
  v_value text;
  v_normalised text;
  v_seen text[] := ARRAY[]::text[];
  v_key text;
BEGIN
  IF p_options IS NULL OR p_key IS NULL OR length(p_key)>2000 THEN RETURN NULL; END IF;
  IF jsonb_typeof(p_options)='array' THEN
    v_options:=p_options;
  ELSIF jsonb_typeof(p_options)='string' THEN
    v_text:=p_options #>> '{}';
    IF length(v_text)>100000 OR NOT pg_input_is_valid(v_text,'jsonb') THEN RETURN NULL; END IF;
    v_options:=v_text::jsonb;
  ELSE
    RETURN NULL;
  END IF;
  IF jsonb_typeof(v_options)<>'array' THEN RETURN NULL; END IF;
  IF jsonb_array_length(v_options) NOT BETWEEN 2 AND 8 THEN RETURN NULL; END IF;
  v_key:=stemcoach_exam_fixture.canonical_choice(p_key);
  IF v_key='' THEN RETURN NULL; END IF;
  FOR v_choice IN SELECT value FROM jsonb_array_elements(v_options) LOOP
    IF jsonb_typeof(v_choice)<>'string' THEN RETURN NULL; END IF;
    v_value:=v_choice #>> '{}';
    -- The byte bound is deliberately conservative versus JS UTF-16 length.
    IF octet_length(v_value)>2000 THEN RETURN NULL; END IF;
    v_normalised:=stemcoach_exam_fixture.canonical_choice(v_value);
    IF v_normalised='' OR v_normalised=ANY(v_seen) THEN RETURN NULL; END IF;
    v_seen:=array_append(v_seen,v_normalised);
  END LOOP;
  IF NOT (v_key=ANY(v_seen)) THEN RETURN NULL; END IF;
  RETURN v_options;
END;
$option_validation$;


REVOKE ALL ON FUNCTION stemcoach_exam_fixture.canonical_choice(text),
  stemcoach_exam_fixture.usable_options(jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION stemcoach_exam_fixture.canonical_choice(text),
  stemcoach_exam_fixture.usable_options(jsonb,text) TO service_role;

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

  IF v_session.cancelled_at IS NOT NULL THEN
    RAISE EXCEPTION 'Exam session cancelled' USING ERRCODE = '22023';
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
    SELECT sq.position, sq.question_id, sq.revision, sq.stem_snapshot, sq.options_snapshot, sq.key_digest,
      sq.topic_snapshot,sq.difficulty_snapshot,sq.points_snapshot,
      q.question_text, q.subject, q.curriculum, q.boards,q.topic,q.difficulty,q.points,
      q.question_type, q.review_status, q.review_revision, q.academic_verified_at,
      q.academic_verified_by, stemcoach_exam_fixture.usable_options(q.options,q.correct_answer) AS options, q.correct_answer
    FROM stemcoach_exam_fixture.session_questions sq
    JOIN stemcoach_exam_fixture.questions q ON q.id = sq.question_id
    WHERE sq.session_id = p_session ORDER BY sq.position FOR SHARE OF q
  LOOP
    IF v_question.subject <> v_session.subject OR v_question.curriculum <> v_session.curriculum
      OR (v_session.board IS NOT NULL AND NOT coalesce(v_session.board=ANY(v_question.boards),false))
      OR v_question.review_status <> 'published' OR v_question.review_revision <> v_question.revision
      OR v_question.academic_verified_at IS NULL OR v_question.academic_verified_by IS NULL
      OR v_question.question_type <> 'mcq'
      OR octet_length(v_question.question_text) NOT BETWEEN 1 AND 12000
      OR stemcoach_exam_fixture.canonical_choice(v_question.question_text)=''
      OR octet_length(v_question.topic) NOT BETWEEN 1 AND 1000
      OR stemcoach_exam_fixture.canonical_choice(v_question.topic)=''
      OR v_question.difficulty NOT BETWEEN 1 AND 5 OR v_question.points NOT BETWEEN 1 AND 10000
      OR (v_question.topic_snapshot IS NOT NULL AND v_question.topic_snapshot IS DISTINCT FROM v_question.topic)
      OR (v_question.difficulty_snapshot IS NOT NULL AND v_question.difficulty_snapshot IS DISTINCT FROM v_question.difficulty)
      OR (v_question.points_snapshot IS NOT NULL AND v_question.points_snapshot IS DISTINCT FROM v_question.points)
      OR (v_question.stem_snapshot IS NOT NULL AND v_question.stem_snapshot IS DISTINCT FROM v_question.question_text)
      OR (v_question.options_snapshot IS NOT NULL AND v_question.options_snapshot IS DISTINCT FROM v_question.options)
      OR (v_question.key_digest IS NOT NULL AND v_question.key_digest IS DISTINCT FROM sha256(convert_to(v_question.correct_answer,'UTF8')))
      OR (v_session.request_id IS NOT NULL AND v_question.stem_snapshot IS NULL) THEN
      RAISE EXCEPTION 'Assigned question changed or not gradeable' USING ERRCODE = '22023';
    END IF;
    IF v_question.options IS NULL THEN
      RAISE EXCEPTION 'Invalid assigned answer choices' USING ERRCODE = '22023';
    END IF;
    v_answer := v_payload->>v_question.question_id::text;
    -- The learner must select an issued option (only ASCII edge trimming is
    -- allowed for transport/replay). Compare its canonical value with the
    -- verified key; do not accept arbitrary case-folded or NFKC submissions.
    IF v_answer IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_question.options) AS choice(value)
      WHERE btrim(choice.value,E' \t\r\n')=v_answer
    ) THEN
      RAISE EXCEPTION 'Answer is not an assigned option' USING ERRCODE = '22023';
    END IF;
    v_correct := v_answer IS NOT NULL AND
      stemcoach_exam_fixture.canonical_choice(v_answer)=stemcoach_exam_fixture.canonical_choice(v_question.correct_answer);
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


-- Issuance is an isolated server-only operation. Existing manual fixtures may
-- leave request_id/snapshot fields null; the new issuer always fills them.
GRANT INSERT ON stemcoach_exam_fixture.sessions, stemcoach_exam_fixture.session_questions TO service_role;

-- p_actor and template constraints must be established by authenticated
-- server code. p_request is a retry token, not a caller-selected session ID.
-- Deterministic selection is for the fixture only, not a production exam sampler.
CREATE FUNCTION stemcoach_exam_fixture.issue_mock_exam(
  p_actor uuid, p_request uuid, p_subject text, p_curriculum text,
  p_count integer, p_duration integer, p_board text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $issue_mock_exam$
DECLARE
  v_session stemcoach_exam_fixture.sessions%ROWTYPE;
  v_row record;
  v_questions jsonb := '[]'::jsonb;
  v_number integer := 0;
  v_session_id uuid;
  v_expiry timestamptz;
BEGIN
  IF p_actor IS NULL OR p_request IS NULL OR p_subject IS NULL OR p_curriculum IS NULL
    OR length(p_subject) NOT BETWEEN 1 AND 100 OR length(p_curriculum) NOT BETWEEN 1 AND 100
    OR p_subject <> btrim(p_subject) OR p_curriculum <> btrim(p_curriculum)
    OR (p_board IS NOT NULL AND (length(p_board) NOT BETWEEN 1 AND 150 OR p_board<>btrim(p_board)))
    OR p_count IS NULL OR p_count NOT BETWEEN 1 AND 100
    OR p_duration IS NULL OR p_duration NOT BETWEEN 60 AND 10800 THEN
    RAISE EXCEPTION 'Invalid exam issuance request' USING ERRCODE = '22023';
  END IF;
  -- Serialize issuers for one learner without taking quota locks before question locks.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text, 493801));
  SELECT s.* INTO v_session FROM stemcoach_exam_fixture.sessions s
    WHERE s.user_id=p_actor AND s.request_id=p_request FOR SHARE;
  IF FOUND THEN
    IF v_session.subject IS DISTINCT FROM p_subject OR v_session.curriculum IS DISTINCT FROM p_curriculum
      OR v_session.board IS DISTINCT FROM p_board
      OR v_session.requested_count IS DISTINCT FROM p_count OR v_session.duration_seconds IS DISTINCT FROM p_duration THEN
      RAISE EXCEPTION 'Issuance request differs from existing session' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM stemcoach_exam_fixture.receipts r WHERE r.session_id=v_session.id AND r.user_id=p_actor) THEN
      RETURN jsonb_build_object('session_id',v_session.id,'status','completed');
    END IF;
    IF v_session.cancelled_at IS NOT NULL THEN
      RETURN jsonb_build_object('session_id',v_session.id,'status','cancelled');
    END IF;
    IF clock_timestamp() >= v_session.expires_at THEN
      RETURN jsonb_build_object('session_id',v_session.id,'status','expired');
    END IF;
    -- A retry never delivers changed, revoked or no-longer-verified material.
    FOR v_row IN
      SELECT sq.position,sq.question_id,sq.revision,sq.stem_snapshot,sq.options_snapshot,sq.key_digest,
        sq.topic_snapshot,sq.difficulty_snapshot,sq.points_snapshot,
        q.review_revision,q.review_status,q.question_type,q.subject,q.curriculum,q.boards,q.topic,q.difficulty,q.points,
        q.academic_verified_at,q.academic_verified_by,q.question_text,
        stemcoach_exam_fixture.usable_options(q.options,q.correct_answer) AS options,q.correct_answer
      FROM stemcoach_exam_fixture.session_questions sq
      JOIN stemcoach_exam_fixture.questions q ON q.id=sq.question_id
      WHERE sq.session_id=v_session.id ORDER BY sq.position FOR SHARE OF q
    LOOP
      IF v_row.review_status <> 'published' OR v_row.question_type <> 'mcq'
        OR v_row.academic_verified_at IS NULL OR v_row.academic_verified_by IS NULL
        OR v_row.subject <> p_subject OR v_row.curriculum <> p_curriculum
        OR (p_board IS NOT NULL AND NOT coalesce(p_board=ANY(v_row.boards),false))
        OR v_row.review_revision <> v_row.revision
        OR v_row.stem_snapshot IS DISTINCT FROM v_row.question_text
        OR v_row.topic_snapshot IS DISTINCT FROM v_row.topic
        OR v_row.difficulty_snapshot IS DISTINCT FROM v_row.difficulty
        OR v_row.points_snapshot IS DISTINCT FROM v_row.points
        OR v_row.options_snapshot IS DISTINCT FROM v_row.options
        OR v_row.key_digest IS DISTINCT FROM sha256(convert_to(v_row.correct_answer,'UTF8'))
        OR v_row.options IS NULL THEN
        RAISE EXCEPTION 'Assigned question changed or not gradeable' USING ERRCODE = '22023';
      END IF;
      v_questions := v_questions || jsonb_build_array(jsonb_build_object(
        'id',v_row.question_id,'question_text',v_row.stem_snapshot,'options',v_row.options_snapshot,
        'topic',v_row.topic_snapshot,'subject',v_session.subject,'difficulty',v_row.difficulty_snapshot,'points',v_row.points_snapshot));
    END LOOP;
    IF jsonb_array_length(v_questions) <> p_count THEN
      RAISE EXCEPTION 'Assigned questions unavailable' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('session_id',v_session.id,'status','active',
      'expires_at',v_session.expires_at,'questions',v_questions);
  END IF;

  IF EXISTS (SELECT 1 FROM stemcoach_exam_fixture.sessions s
      WHERE s.user_id=p_actor AND s.cancelled_at IS NULL AND s.expires_at>clock_timestamp()
        AND NOT EXISTS (SELECT 1 FROM stemcoach_exam_fixture.receipts r WHERE r.session_id=s.id)) THEN
    RAISE EXCEPTION 'An active examination already exists' USING ERRCODE = '22023';
  END IF;
  -- Read-only allowance precheck. Submission is still the authoritative debit.
  IF NOT EXISTS (SELECT 1 FROM stemcoach_exam_fixture.user_quotas q
      WHERE q.user_id=p_actor AND q.mock_exams_used<q.mock_exams_total) THEN
    RAISE EXCEPTION 'Mock-exam allowance exhausted' USING ERRCODE = '22023';
  END IF;
  v_session_id := gen_random_uuid();
  v_expiry := clock_timestamp()+make_interval(secs=>p_duration);
  INSERT INTO stemcoach_exam_fixture.sessions(id,user_id,subject,curriculum,board,expires_at,request_id,requested_count,duration_seconds)
    VALUES(v_session_id,p_actor,p_subject,p_curriculum,p_board,v_expiry,p_request,p_count,p_duration);
  FOR v_row IN
    SELECT q.id,q.review_revision,q.question_text,q.topic,q.difficulty,q.points,
      stemcoach_exam_fixture.usable_options(q.options,q.correct_answer) AS options,q.correct_answer
    FROM stemcoach_exam_fixture.questions q
    WHERE q.subject=p_subject AND q.curriculum=p_curriculum AND q.question_type='mcq'
      AND q.review_status='published' AND q.academic_verified_at IS NOT NULL AND q.academic_verified_by IS NOT NULL
      AND (p_board IS NULL OR p_board=ANY(q.boards))
      AND octet_length(q.question_text) BETWEEN 1 AND 12000
      AND stemcoach_exam_fixture.canonical_choice(q.question_text)<>''
      AND octet_length(q.topic) BETWEEN 1 AND 1000
      AND stemcoach_exam_fixture.canonical_choice(q.topic)<>''
      AND q.difficulty BETWEEN 1 AND 5 AND q.points BETWEEN 1 AND 10000
      AND stemcoach_exam_fixture.usable_options(q.options,q.correct_answer) IS NOT NULL
    ORDER BY q.id LIMIT p_count FOR SHARE OF q
  LOOP
    v_number := v_number+1;
    INSERT INTO stemcoach_exam_fixture.session_questions(session_id,position,question_id,revision,stem_snapshot,options_snapshot,topic_snapshot,difficulty_snapshot,points_snapshot,key_digest)
      VALUES(v_session_id,v_number,v_row.id,v_row.review_revision,v_row.question_text,v_row.options,v_row.topic,v_row.difficulty,v_row.points,sha256(convert_to(v_row.correct_answer,'UTF8')));
    v_questions := v_questions || jsonb_build_array(jsonb_build_object(
      'id',v_row.id,'question_text',v_row.question_text,'options',v_row.options,
      'topic',v_row.topic,'subject',p_subject,'difficulty',v_row.difficulty,'points',v_row.points));
  END LOOP;
  IF v_number <> p_count THEN
    RAISE EXCEPTION 'Insufficient verified exam questions' USING ERRCODE = '22023';
  END IF;
  RETURN jsonb_build_object('session_id',v_session_id,'status','active',
    'expires_at',v_expiry,'questions',v_questions);
END;
$issue_mock_exam$;
REVOKE ALL ON FUNCTION stemcoach_exam_fixture.issue_mock_exam(uuid,uuid,text,text,integer,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION stemcoach_exam_fixture.issue_mock_exam(uuid,uuid,text,text,integer,integer,text) TO service_role;


-- Session status and receipt recovery are separate from grading. A trusted
-- authenticated caller must derive p_actor on the server. Never accept it
-- from an untrusted browser payload. The status read takes a shared session
-- lock so it observes the outcome of any submission/cancellation ahead of it.
CREATE FUNCTION stemcoach_exam_fixture.get_mock_exam_status(p_actor uuid,p_session uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $mock_exam_status$
DECLARE
  v_session stemcoach_exam_fixture.sessions%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT s.* INTO v_session FROM stemcoach_exam_fixture.sessions s
    WHERE s.id=p_session AND s.user_id=p_actor FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam session unavailable' USING ERRCODE='42501';
  END IF;
  SELECT r.result INTO v_result FROM stemcoach_exam_fixture.receipts r
    WHERE r.session_id=v_session.id AND r.user_id=p_actor;
  IF FOUND THEN
    -- A confirmed receipt remains recoverable after expiry, cancellation
    -- requests, exhausted allowance or later editorial changes.
    RETURN jsonb_build_object('session_id',v_session.id,'status','completed','result',v_result);
  END IF;
  IF v_session.cancelled_at IS NOT NULL THEN
    RETURN jsonb_build_object('session_id',v_session.id,'status','cancelled');
  END IF;
  IF clock_timestamp()>=v_session.expires_at THEN
    RETURN jsonb_build_object('session_id',v_session.id,'status','expired');
  END IF;
  RETURN jsonb_build_object('session_id',v_session.id,'status','active','expires_at',v_session.expires_at);
END;
$mock_exam_status$;

-- Cancellation is a terminal transition, not a refund or grading operation.
-- Both submit and cancel acquire the same exclusive session row lock first.
-- Whichever commits first determines the outcome; a rolled-back cancellation
-- has no effect. Completed and expired sessions are never rewritten.
CREATE FUNCTION stemcoach_exam_fixture.cancel_mock_exam(p_actor uuid,p_session uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,pg_temp
AS $cancel_mock_exam$
DECLARE
  v_session stemcoach_exam_fixture.sessions%ROWTYPE;
  v_status jsonb;
  v_now timestamptz;
BEGIN
  SELECT s.* INTO v_session FROM stemcoach_exam_fixture.sessions s
    WHERE s.id=p_session AND s.user_id=p_actor FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam session unavailable' USING ERRCODE='42501';
  END IF;
  v_status:=stemcoach_exam_fixture.get_mock_exam_status(p_actor,p_session);
  IF v_status->>'status'<>'active' THEN RETURN v_status; END IF;
  v_now:=clock_timestamp();
  IF v_now>=v_session.expires_at THEN
    RETURN jsonb_build_object('session_id',v_session.id,'status','expired');
  END IF;
  UPDATE stemcoach_exam_fixture.sessions SET cancelled_at=v_now
    WHERE id=v_session.id AND user_id=p_actor;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam session unavailable' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object('session_id',v_session.id,'status','cancelled');
END;
$cancel_mock_exam$;
REVOKE ALL ON FUNCTION stemcoach_exam_fixture.get_mock_exam_status(uuid,uuid),
  stemcoach_exam_fixture.cancel_mock_exam(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION stemcoach_exam_fixture.get_mock_exam_status(uuid,uuid),
  stemcoach_exam_fixture.cancel_mock_exam(uuid,uuid) TO service_role;
